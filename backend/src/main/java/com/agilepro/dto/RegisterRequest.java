package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    @NotBlank @Size(min=2,max=100) public String fullName;
    @Email @NotBlank public String email;
    @NotBlank @Size(min=8,max=128)
    @Pattern(regexp="^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$", message="Password must contain uppercase, number and special character")
    public String password;
    public String phone;
    public String company;
    public String jobTitle;
    public String country;
    @AssertTrue(message="You must accept the terms") public boolean termsAccepted;
}
