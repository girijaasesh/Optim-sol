package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ResetPasswordRequest {
    @NotBlank public String token;
    @NotBlank @Size(min=8)
    @Pattern(regexp="^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$")
    public String newPassword;
}
