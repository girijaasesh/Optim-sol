package com.agilepro.controller;

import com.agilepro.dto.*;
import com.agilepro.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Tag(name = "Courses")
class CourseController {
    private final CourseService courseService;

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<CourseDto>>> list(
        @RequestParam(required=false) String type,
        @RequestParam(defaultValue="USD") String currency) {
        return ResponseEntity.ok(courseService.listPublicCourses(type, currency));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<CourseDto>> get(
        @PathVariable Long id, @RequestParam(defaultValue="USD") String currency) {
        return ResponseEntity.ok(courseService.getCourseById(id, currency));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CourseDto>> create(@Valid @RequestBody CreateCourseRequest req) {
        return ResponseEntity.ok(courseService.createCourse(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CourseDto>> update(
        @PathVariable Long id, @Valid @RequestBody CreateCourseRequest req) {
        return ResponseEntity.ok(courseService.updateCourse(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteCourse(id));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CourseDto>> duplicate(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.duplicateCourse(id));
    }

    @PostMapping("/{id}/sold-out")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> soldOut(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.markSoldOut(id));
    }
}

@RestController
@RequestMapping("/registrations")
@RequiredArgsConstructor
@Tag(name = "Registrations")
class RegistrationController {
    private final RegistrationService registrationService;
    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<RegistrationDto>> register(
        @Valid @RequestBody CreateRegistrationRequest req,
        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(registrationService.createRegistration(req, user.getUsername()));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<RegistrationDto>>> mine(
        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(registrationService.getUserRegistrations(user.getUsername()));
    }

    @PostMapping("/payment/create-intent")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PaymentIntentResponse>> createIntent(
        @Valid @RequestBody CreatePaymentIntentRequest req) {
        return ResponseEntity.ok(paymentService.createPaymentIntent(req));
    }

    @PostMapping("/payment/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String payload,
        @RequestHeader("Stripe-Signature") String sig) {
        paymentService.handleWebhook(payload, sig);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/validate-coupon")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
        @RequestParam String code, @RequestParam Long courseId,
        @RequestParam(defaultValue="USD") String currency) {
        return ResponseEntity.ok(registrationService.validateCoupon(code, courseId, currency));
    }
}

@RestController
@RequestMapping("/waitlist")
@RequiredArgsConstructor
@Tag(name = "Waitlist")
class WaitlistController {
    private final WaitlistService waitlistService;

    @PostMapping("/join")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> join(
        @RequestParam Long courseId, @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(waitlistService.joinWaitlist(courseId, user.getUsername()));
    }

    @DeleteMapping("/leave")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> leave(
        @RequestParam Long courseId, @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(waitlistService.leaveWaitlist(courseId, user.getUsername()));
    }
}

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin")
class AdminController {
    private final AdminService adminService;
    private final RegistrationService registrationService;
    private final CouponService couponService;
    private final CertificateService certificateService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> dashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/registrations")
    public ResponseEntity<ApiResponse<Page<RegistrationDto>>> allRegistrations(
        @RequestParam(required=false) String status,
        @RequestParam(required=false) Long courseId,
        @RequestParam(required=false) String search,
        Pageable pageable) {
        return ResponseEntity.ok(registrationService.getAllRegistrations(status, courseId, search, pageable));
    }

    @PostMapping("/registrations/{id}/confirm")
    public ResponseEntity<ApiResponse<RegistrationDto>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.confirmRegistration(id));
    }

    @PostMapping("/coupons")
    public ResponseEntity<ApiResponse<?>> createCoupon(@Valid @RequestBody CreateCouponRequest req) {
        return ResponseEntity.ok(couponService.createCoupon(req));
    }

    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<?>> listCoupons() {
        return ResponseEntity.ok(couponService.listCoupons());
    }

    @PostMapping("/certificates/issue/{registrationId}")
    public ResponseEntity<ApiResponse<?>> issueCert(@PathVariable Long registrationId) {
        return ResponseEntity.ok(certificateService.issueCertificate(registrationId));
    }

    @GetMapping("/certificates")
    public ResponseEntity<ApiResponse<?>> listCerts(Pageable pageable) {
        return ResponseEntity.ok(certificateService.listCertificates(pageable));
    }

    @GetMapping("/registrations/export")
    public ResponseEntity<byte[]> export(@RequestParam(required=false) Long courseId) {
        byte[] csv = registrationService.exportToCsv(courseId);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=registrations.csv")
            .body(csv);
    }

    @PostMapping("/bulk-email")
    public ResponseEntity<ApiResponse<Void>> bulkEmail(@RequestBody BulkEmailRequest req) {
        return ResponseEntity.ok(adminService.sendBulkEmail(req));
    }
}

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User Profile")
class UserProfileController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserDto>> profile(@AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(userService.getProfile(u.getUsername()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserDto>> update(
        @AuthenticationPrincipal UserDetails u,
        @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(u.getUsername(), req));
    }
}
