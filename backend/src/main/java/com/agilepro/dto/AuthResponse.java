package com.agilepro.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private boolean mfaRequired;
    private String mfaToken;
    private UserDto user;
}
