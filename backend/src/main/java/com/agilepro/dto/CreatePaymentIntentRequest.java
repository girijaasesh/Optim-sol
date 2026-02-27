package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreatePaymentIntentRequest {
    @NotNull public Long registrationId;
    public String currency;
    public String couponCode;
}
