package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RefreshTokenRequest {
    @NotBlank public String refreshToken;
}
