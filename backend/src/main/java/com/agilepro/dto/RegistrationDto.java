package com.agilepro.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegistrationDto {
    private Long id;
    private String registrationRef;
    private UserDto user;
    private CourseDto course;
    private String status;
    private BigDecimal amount;
    private String currency;
    private String paymentStatus;
    private String couponCode;
    private BigDecimal discountAmount;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private String stripeSessionId;
}
