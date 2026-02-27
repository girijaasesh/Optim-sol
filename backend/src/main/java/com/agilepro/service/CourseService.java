package com.agilepro.service;

import com.agilepro.dto.*;
import com.agilepro.entity.Course;
import com.agilepro.enums.CertificationType;
import com.agilepro.exception.ResourceNotFoundException;
import com.agilepro.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final CurrencyService currencyService;

    // ── Public listing ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ApiResponse<List<CourseDto>> listPublicCourses(String type, String currency) {
        List<Course> courses = (type != null && !type.isBlank())
            ? courseRepository.findByCertificationTypeAndActiveTrue(CertificationType.valueOf(type.toUpperCase()))
            : courseRepository.findAllUpcoming(LocalDate.now());
        List<CourseDto> dtos = courses.stream()
            .map(c -> toDto(c, currency))
            .collect(Collectors.toList());
        return ApiResponse.ok(dtos);
    }

    @Transactional(readOnly = true)
    public ApiResponse<CourseDto> getCourseById(Long id, String currency) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        return ApiResponse.ok(toDto(course, currency));
    }

    // ── Admin CRUD ─────────────────────────────────────────────────
    public ApiResponse<CourseDto> createCourse(CreateCourseRequest req) {
        Course course = Course.builder()
            .certificationType(CertificationType.valueOf(req.getCertificationType().toUpperCase()))
            .title(req.getTitle())
            .description(req.getDescription())
            .price(req.getPrice())
            .earlyBirdPrice(req.getEarlyBirdPrice())
            .earlyBirdDeadline(req.getEarlyBirdDeadline() != null ? LocalDate.parse(req.getEarlyBirdDeadline()) : null)
            .maxSeats(req.getMaxSeats())
            .durationDays(req.getDurationDays() > 0 ? req.getDurationDays() : 2)
            .format(req.getFormat() != null ? com.agilepro.enums.CourseFormat.valueOf(req.getFormat().toUpperCase()) : com.agilepro.enums.CourseFormat.VIRTUAL)
            .zoomLink(req.getZoomLink())
            .venue(req.getVenue())
            .materialsLink(req.getMaterialsLink())
            .startDate(req.getStartDate() != null ? LocalDate.parse(req.getStartDate()) : null)
            .endDate(req.getEndDate() != null ? LocalDate.parse(req.getEndDate()) : null)
            .targetAudience(req.getTargetAudience())
            .learningOutcomes(req.getLearningOutcomes() != null ? req.getLearningOutcomes() : List.of())
            .build();
        return ApiResponse.ok(toDto(courseRepository.save(course), "USD"), "Course created");
    }

    public ApiResponse<CourseDto> updateCourse(Long id, CreateCourseRequest req) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        if (req.getTitle() != null) course.setTitle(req.getTitle());
        if (req.getDescription() != null) course.setDescription(req.getDescription());
        if (req.getPrice() != null) course.setPrice(req.getPrice());
        if (req.getEarlyBirdPrice() != null) course.setEarlyBirdPrice(req.getEarlyBirdPrice());
        if (req.getMaxSeats() > 0) course.setMaxSeats(req.getMaxSeats());
        if (req.getZoomLink() != null) course.setZoomLink(req.getZoomLink());
        if (req.getVenue() != null) course.setVenue(req.getVenue());
        if (req.getStartDate() != null) course.setStartDate(LocalDate.parse(req.getStartDate()));
        if (req.getEndDate() != null) course.setEndDate(LocalDate.parse(req.getEndDate()));
        return ApiResponse.ok(toDto(courseRepository.save(course), "USD"), "Course updated");
    }

    public ApiResponse<Void> deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) throw new ResourceNotFoundException("Course", id);
        courseRepository.deleteById(id);
        return ApiResponse.ok(null, "Course deleted");
    }

    public ApiResponse<CourseDto> duplicateCourse(Long id) {
        Course orig = courseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        Course copy = Course.builder()
            .certificationType(orig.getCertificationType())
            .title(orig.getTitle() + " (Copy)")
            .description(orig.getDescription())
            .price(orig.getPrice())
            .earlyBirdPrice(orig.getEarlyBirdPrice())
            .maxSeats(orig.getMaxSeats())
            .durationDays(orig.getDurationDays())
            .format(orig.getFormat())
            .zoomLink(orig.getZoomLink())
            .venue(orig.getVenue())
            .materialsLink(orig.getMaterialsLink())
            .targetAudience(orig.getTargetAudience())
            .learningOutcomes(orig.getLearningOutcomes())
            .build();
        return ApiResponse.ok(toDto(courseRepository.save(copy), "USD"), "Course duplicated");
    }

    public ApiResponse<Void> markSoldOut(Long id) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        course.setSoldOut(true);
        courseRepository.save(course);
        return ApiResponse.ok(null, "Course marked as sold out");
    }

    // ── Mapper ─────────────────────────────────────────────────────
    public CourseDto toDto(Course c, String currency) {
        BigDecimal rate = currencyService.getRate(currency != null ? currency : "USD");
        BigDecimal effective = c.getEffectivePrice().multiply(rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseConverted = c.getPrice().multiply(rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ebConverted = c.getEarlyBirdPrice() != null
            ? c.getEarlyBirdPrice().multiply(rate).setScale(2, RoundingMode.HALF_UP) : null;

        return CourseDto.builder()
            .id(c.getId())
            .certificationType(c.getCertificationType().name())
            .title(c.getTitle())
            .description(c.getDescription())
            .price(baseConverted)
            .earlyBirdPrice(ebConverted)
            .earlyBirdDeadline(c.getEarlyBirdDeadline() != null ? c.getEarlyBirdDeadline().toString() : null)
            .maxSeats(c.getMaxSeats())
            .seatsRemaining(c.getSeatsRemaining())
            .durationDays(c.getDurationDays())
            .format(c.getFormat().name())
            .zoomLink(c.getZoomLink())
            .venue(c.getVenue())
            .materialsLink(c.getMaterialsLink())
            .active(c.isActive())
            .soldOut(c.isSoldOut() || c.getSeatsRemaining() == 0)
            .startDate(c.getStartDate() != null ? c.getStartDate().toString() : null)
            .endDate(c.getEndDate() != null ? c.getEndDate().toString() : null)
            .targetAudience(c.getTargetAudience())
            .learningOutcomes(c.getLearningOutcomes())
            .effectivePrice(effective)
            .earlyBirdActive(c.isEarlyBirdActive())
            .build();
    }
}
