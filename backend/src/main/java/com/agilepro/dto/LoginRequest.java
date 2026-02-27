package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LoginRequest {
    @Email @NotBlank public String email;
    @NotBlank @Size(min=6) public String password;
    public boolean rememberMe;
}
