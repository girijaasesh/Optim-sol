package com.agilepro.service;

import com.agilepro.dto.ApiResponse;
import com.agilepro.entity.Course;
import com.agilepro.entity.User;
import com.agilepro.entity.WaitlistEntry;
import com.agilepro.enums.WaitlistStatus;
import com.agilepro.exception.ResourceNotFoundException;
import com.agilepro.repository.CourseRepository;
import com.agilepro.repository.UserRepository;
import com.agilepro.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ApiResponse<Void> joinWaitlist(Long courseId, String email) {
        if (waitlistRepository.existsByUserEmailAndCourseId(email, courseId)) {
            return ApiResponse.error("Already on waitlist", "ALREADY_WAITLISTED");
        }
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        long position = waitlistRepository.findByCourseIdAndStatusOrderByPosition(
            courseId, WaitlistStatus.WAITING).size() + 1;

        waitlistRepository.save(WaitlistEntry.builder()
            .user(user).course(course)
            .position((int) position)
            .status(WaitlistStatus.WAITING)
            .build());

        return ApiResponse.ok(null, "Added to waitlist at position " + position);
    }

    public ApiResponse<Void> leaveWaitlist(Long courseId, String email) {
        waitlistRepository.findByUserEmailAndCourseId(email, courseId)
            .ifPresent(waitlistRepository::delete);
        return ApiResponse.ok(null, "Removed from waitlist");
    }

    /** Called when a registration is cancelled — notify next person */
    public void promoteNextOnWaitlist(Course course) {
        waitlistRepository.findFirstByCourseIdAndStatusOrderByPosition(
            course.getId(), WaitlistStatus.WAITING).ifPresent(entry -> {
            entry.setStatus(WaitlistStatus.NOTIFIED);
            entry.setNotifiedAt(LocalDateTime.now());
            entry.setExpiresAt(LocalDateTime.now().plusHours(48));
            waitlistRepository.save(entry);
            String link = "http://localhost:4200/register?courseId=" + course.getId()
                + "&waitlist=true";
            emailService.sendWaitlistNotification(
                entry.getUser().getEmail(),
                entry.getUser().getFullName(),
                course.getTitle(),
                link);
            log.info("Notified waitlist entry {} for course {}", entry.getId(), course.getId());
        });
    }
}
