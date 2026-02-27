package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateCouponRequest {
    @NotBlank public String code;
    @NotBlank public String discountType;
    @NotNull public BigDecimal discountValue;
    public Integer usageLimit;
    public String expiryDate;
    public String applicableCourseType;
}
