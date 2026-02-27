package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ForgotPasswordRequest {
    @Email @NotBlank public String email;
}
