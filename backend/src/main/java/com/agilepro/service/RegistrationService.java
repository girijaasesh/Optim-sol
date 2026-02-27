package com.agilepro.service;

import com.agilepro.dto.*;
import com.agilepro.entity.*;
import com.agilepro.enums.*;
import com.agilepro.exception.ResourceNotFoundException;
import com.agilepro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final CurrencyService currencyService;
    private final WaitlistService waitlistService;
    private final EmailService emailService;
    private final CourseService courseService;

    // ── Create registration ────────────────────────────────────────
    public ApiResponse<RegistrationDto> createRegistration(CreateRegistrationRequest req, String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Course course = courseRepository.findById(req.getCourseId())
            .orElseThrow(() -> new ResourceNotFoundException("Course", req.getCourseId()));

        String currency = req.getCurrency() != null ? req.getCurrency().toUpperCase() : "USD";
        BigDecimal rate = currencyService.getRate(currency);
        BigDecimal baseUsd = course.getEffectivePrice();
        BigDecimal amount = baseUsd.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO;

        // Validate coupon
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            CouponValidationResponse couponResult = couponService.validateCoupon(
                req.getCouponCode(), amount, currency);
            if (couponResult.isValid()) {
                discount = couponResult.getDiscountAmount();
                amount = amount.subtract(discount).max(BigDecimal.ZERO);
            }
        }

        // Check seats — put on waitlist if full
        if (course.isSoldOut() || course.getSeatsRemaining() <= 0) {
            waitlistService.joinWaitlist(course.getId(), email);
            return ApiResponse.ok(null, "Course is full. You have been added to the waitlist.");
        }

        String ref = generateRef();
        Registration reg = Registration.builder()
            .registrationRef(ref)
            .user(user)
            .course(course)
            .amount(amount)
            .currency(currency)
            .couponCode(req.getCouponCode())
            .discountAmount(discount.compareTo(BigDecimal.ZERO) > 0 ? discount : null)
            .specialAccommodations(req.getSpecialAccommodations())
            .gstNumber(req.getGstNumber())
            .experienceLevel(req.getExperienceLevel())
            .status(RegistrationStatus.PENDING)
            .build();

        registrationRepository.save(reg);
        if (req.getCouponCode() != null) couponService.incrementUsage(req.getCouponCode());

        return ApiResponse.ok(toDto(reg), "Registration created. Complete payment to confirm.");
    }

    // ── Get user registrations ─────────────────────────────────────
    @Transactional(readOnly = true)
    public ApiResponse<List<RegistrationDto>> getUserRegistrations(String email) {
        List<RegistrationDto> dtos = registrationRepository.findByUserEmail(email)
            .stream().map(this::toDto).collect(Collectors.toList());
        return ApiResponse.ok(dtos);
    }

    // ── Admin: all registrations ───────────────────────────────────
    @Transactional(readOnly = true)
    public ApiResponse<Page<RegistrationDto>> getAllRegistrations(
        String status, Long courseId, String search, Pageable pageable) {
        RegistrationStatus rs = status != null ? RegistrationStatus.valueOf(status.toUpperCase()) : null;
        Page<RegistrationDto> page = registrationRepository
            .findAllFiltered(rs, courseId, search, pageable)
            .map(this::toDto);
        return ApiResponse.ok(page);
    }

    // ── Confirm registration ───────────────────────────────────────
    public ApiResponse<RegistrationDto> confirmRegistration(Long id) {
        Registration reg = registrationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Registration", id));
        reg.setStatus(RegistrationStatus.CONFIRMED);
        reg.setPaymentStatus(PaymentStatus.PAID);
        reg.setConfirmedAt(LocalDateTime.now());
        registrationRepository.save(reg);

        String courseDate = reg.getCourse().getStartDate() != null
            ? reg.getCourse().getStartDate().toString() : "TBD";
        emailService.sendRegistrationConfirmation(
            reg.getUser().getEmail(), reg.getUser().getFullName(),
            reg.getRegistrationRef(), reg.getCourse().getTitle(), courseDate);

        return ApiResponse.ok(toDto(reg), "Registration confirmed");
    }

    // ── Validate coupon ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ApiResponse<CouponValidationResponse> validateCoupon(String code, Long courseId, String currency) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        BigDecimal rate = currencyService.getRate(currency);
        BigDecimal price = course.getEffectivePrice().multiply(rate).setScale(2, RoundingMode.HALF_UP);
        return ApiResponse.ok(couponService.validateCoupon(code, price, currency));
    }

    // ── CSV export ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] exportToCsv(Long courseId) {
        List<Registration> regs = courseId != null
            ? registrationRepository.findByCourseId(courseId)
            : registrationRepository.findAll();

        StringBuilder sb = new StringBuilder();
        sb.append("Ref,Name,Email,Course,Status,Amount,Currency,Payment,Coupon,Date\n");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        for (Registration r : regs) {
            sb.append(String.join(",",
                r.getRegistrationRef(),
                "\"" + r.getUser().getFullName() + "\"",
                r.getUser().getEmail(),
                "\"" + r.getCourse().getTitle() + "\"",
                r.getStatus().name(),
                r.getAmount().toPlainString(),
                r.getCurrency(),
                r.getPaymentStatus().name(),
                r.getCouponCode() != null ? r.getCouponCode() : "",
                r.getCreatedAt().format(fmt)
            )).append("\n");
        }
        return sb.toString().getBytes();
    }

    // ── Mapper ─────────────────────────────────────────────────────
    public RegistrationDto toDto(Registration r) {
        return RegistrationDto.builder()
            .id(r.getId())
            .registrationRef(r.getRegistrationRef())
            .user(toUserDto(r.getUser()))
            .course(courseService.toDto(r.getCourse(), r.getCurrency()))
            .status(r.getStatus().name())
            .amount(r.getAmount())
            .currency(r.getCurrency())
            .paymentStatus(r.getPaymentStatus().name())
            .couponCode(r.getCouponCode())
            .discountAmount(r.getDiscountAmount())
            .createdAt(r.getCreatedAt())
            .confirmedAt(r.getConfirmedAt())
            .stripeSessionId(r.getStripeSessionId())
            .build();
    }

    private UserDto toUserDto(User u) {
        return UserDto.builder()
            .id(u.getId()).fullName(u.getFullName()).email(u.getEmail())
            .role(u.getRole().name()).avatarUrl(u.getAvatarUrl())
            .company(u.getCompany()).country(u.getCountry()).build();
    }

    private String generateRef() {
        return "REG-" + LocalDateTime.now().getYear()
            + "-" + String.format("%05d", new Random().nextInt(99999));
    }
}
