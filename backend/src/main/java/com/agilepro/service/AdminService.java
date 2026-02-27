package com.agilepro.service;

import com.agilepro.controller.BulkEmailRequest;
import com.agilepro.dto.*;
import com.agilepro.enums.CertificateStatus;
import com.agilepro.enums.PaymentStatus;
import com.agilepro.enums.WaitlistStatus;
import com.agilepro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminService {

    private final RegistrationRepository registrationRepository;
    private final CourseRepository courseRepository;
    private final CertificateRepository certificateRepository;
    private final WaitlistRepository waitlistRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ApiResponse<DashboardStats> getDashboardStats() {
        LocalDateTime yearStart = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);

        BigDecimal revenueYtd = registrationRepository
            .sumAmountByPaymentStatusAndCreatedAtAfter(PaymentStatus.PAID, yearStart);
        BigDecimal revenueMonth = registrationRepository
            .sumAmountByPaymentStatusAndCreatedAtAfter(PaymentStatus.PAID, monthStart);
        long totalReg  = registrationRepository.count();
        long upcoming  = courseRepository.countByActiveTrueAndStartDateAfter(java.time.LocalDate.now());
        long waitlists = waitlistRepository.countByStatus(WaitlistStatus.WAITING);
        long certs     = certificateRepository.countByStatus(CertificateStatus.ISSUED);

        // Monthly revenue for chart (last 12 months)
        List<Object[]> rawMonthly = registrationRepository.monthlyRevenue(
            LocalDateTime.now().minusMonths(12));
        List<DashboardStats.MonthlyRevenue> monthly = rawMonthly.stream()
            .map(row -> DashboardStats.MonthlyRevenue.builder()
                .month(row[0].toString())
                .enrollments(((Number) row[1]).intValue())
                .revenue(new BigDecimal(row[2].toString()))
                .build())
            .collect(Collectors.toList());

        DashboardStats stats = DashboardStats.builder()
            .totalRegistrations(totalReg)
            .revenueYtd(revenueYtd != null ? revenueYtd : BigDecimal.ZERO)
            .revenueThisMonth(revenueMonth != null ? revenueMonth : BigDecimal.ZERO)
            .upcomingCourses((int) upcoming)
            .waitlistTotal((int) waitlists)
            .certificatesIssued((int) certs)
            .monthlyRevenue(monthly)
            .build();

        return ApiResponse.ok(stats);
    }

    @Transactional
    public ApiResponse<Void> sendBulkEmail(BulkEmailRequest req) {
        req.registrationIds().forEach(regId ->
            registrationRepository.findById(regId).ifPresent(reg ->
                emailService.sendHtmlBulkEmail(
                    reg.getUser().getEmail(),
                    reg.getUser().getFullName(),
                    req.subject(),
                    req.body())));
        log.info("Bulk email sent to {} recipients", req.registrationIds().size());
        return ApiResponse.ok(null, "Emails queued for " + req.registrationIds().size() + " recipients");
    }
}
