package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MfaVerifyRequest {
    @NotBlank public String mfaToken;
    @NotBlank @Size(min=6,max=8) public String code;
}
