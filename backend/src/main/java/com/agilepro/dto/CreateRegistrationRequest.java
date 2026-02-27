package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateRegistrationRequest {
    @NotNull public Long courseId;
    public String couponCode;
    public String currency;
    public String specialAccommodations;
    public String gstNumber;
    public String experienceLevel;
}
