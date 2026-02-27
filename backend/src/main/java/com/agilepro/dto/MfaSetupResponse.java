package com.agilepro.dto;
import lombok.*;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MfaSetupResponse {
    private String secret;
    private String qrCodeDataUri;
    private List<String> backupCodes;
}
