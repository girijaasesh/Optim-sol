package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BackupCodeRequest {
    @NotBlank public String mfaToken;
    @NotBlank public String backupCode;
}
