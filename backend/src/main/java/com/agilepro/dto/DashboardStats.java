package com.agilepro.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardStats {
    private long totalRegistrations;
    private BigDecimal revenueYtd;
    private BigDecimal revenueThisMonth;
    private int upcomingCourses;
    private int waitlistTotal;
    private int certificatesIssued;
    private List<MonthlyRevenue> monthlyRevenue;
    private List<CourseEnrollmentStat> enrollmentByCourse;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyRevenue {
        String month; BigDecimal revenue; int enrollments;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CourseEnrollmentStat {
        String courseName; int count; double percentage;
    }
}
