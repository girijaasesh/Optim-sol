package com.agilepro.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String provider;
    private boolean emailVerified;
    private boolean mfaEnabled;
    private String avatarUrl;
    private String preferredCurrency;
    private String company;
    private String jobTitle;
    private String country;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
