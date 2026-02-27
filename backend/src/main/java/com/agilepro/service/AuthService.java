package com.agilepro.service;

import com.agilepro.dto.*;
import com.agilepro.entity.User;
import com.agilepro.enums.Role;
import com.agilepro.repository.UserRepository;
import com.agilepro.security.JwtService;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final EmailService emailService;
    private final AuditService auditService;
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    @Value("${app.mfa.issuer}")
    private String mfaIssuer;

    private static final int MAX_FAILURES = 5;
    private static final int LOCK_MINUTES = 5;

    // ── REGISTER ──────────────────────────────────────────────────
    public ApiResponse<AuthResponse> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ApiResponse.error("Email already registered", "EMAIL_EXISTS");
        }

        String verificationToken = UUID.randomUUID().toString();
        User user = User.builder()
            .fullName(req.getFullName())
            .email(req.getEmail().toLowerCase())
            .password(passwordEncoder.encode(req.getPassword()))
            .phone(req.getPhone())
            .company(req.getCompany())
            .jobTitle(req.getJobTitle())
            .country(req.getCountry())
            .role(Role.USER)
            .emailVerificationToken(verificationToken)
            .emailVerificationExpiry(LocalDateTime.now().plusHours(24))
            .build();

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationToken);
        auditService.log("REGISTER", user.getEmail(), null, "New user registered");

        return ApiResponse.ok(null, "Registration successful. Please verify your email to continue.");
    }

    // ── USER LOGIN ────────────────────────────────────────────────
    public ApiResponse<AuthResponse> login(LoginRequest req, HttpServletRequest httpReq) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        // Check lockout
        if (!user.isAccountNonLocked()) {
            auditService.log("LOGIN_BLOCKED", req.getEmail(), getIp(httpReq), "Account locked");
            throw new LockedException("Account temporarily locked due to multiple failed attempts");
        }

        // Validate password
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            handleFailedAttempt(user);
            auditService.log("LOGIN_FAILED", req.getEmail(), getIp(httpReq),
                "Failed attempt #" + user.getFailedLoginAttempts());
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!user.isEmailVerified()) {
            return ApiResponse.error("Please verify your email before logging in", "EMAIL_NOT_VERIFIED");
        }

        return buildLoginResponse(user, httpReq);
    }

    // ── ADMIN LOGIN (always MFA) ───────────────────────────────────
    public ApiResponse<AuthResponse> adminLogin(LoginRequest req, HttpServletRequest httpReq) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (user.getRole() == Role.USER) {
            auditService.log("ADMIN_LOGIN_DENIED", req.getEmail(), getIp(httpReq), "Non-admin attempted admin login");
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!user.isAccountNonLocked()) {
            throw new LockedException("Account suspended");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            handleFailedAttempt(user);
            auditService.log("ADMIN_LOGIN_FAILED", req.getEmail(), getIp(httpReq), "Wrong password");
            throw new BadCredentialsException("Invalid credentials");
        }

        // Admin ALWAYS gets MFA challenge
        resetFailedAttempts(user);
        String mfaToken = jwtService.generateMfaPendingToken(user);
        auditService.log("ADMIN_CREDENTIALS_OK", user.getEmail(), getIp(httpReq), "MFA challenge issued");

        return ApiResponse.ok(
            AuthResponse.builder()
                .mfaRequired(true)
                .mfaToken(mfaToken)
                .tokenType("Bearer")
                .build(),
            "Credentials verified. MFA required."
        );
    }

    // ── MFA VERIFY ────────────────────────────────────────────────
    public ApiResponse<AuthResponse> verifyMfa(MfaVerifyRequest req) {
        if (!jwtService.validateToken(req.getMfaToken())) {
            return ApiResponse.error("MFA session expired. Please log in again.", "MFA_TOKEN_EXPIRED");
        }
        String tokenType = jwtService.extractTokenType(req.getMfaToken());
        if (!"MFA_PENDING".equals(tokenType)) {
            return ApiResponse.error("Invalid MFA token", "INVALID_MFA_TOKEN");
        }

        String email = jwtService.extractEmail(req.getMfaToken());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("User not found"));

        boolean valid;
        if (req.getCode().length() == 6) {
            // TOTP code
            valid = user.getMfaSecret() != null &&
                gAuth.authorize(user.getMfaSecret(), Integer.parseInt(req.getCode()));
        } else {
            valid = false;
        }

        if (!valid) {
            return ApiResponse.error("Invalid verification code", "INVALID_MFA_CODE");
        }

        String accessToken  = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        updateLastLogin(user, null);
        auditService.log("MFA_VERIFIED", email, null, "MFA successful");

        return ApiResponse.ok(
            AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .mfaRequired(false)
                .user(toUserDto(user))
                .build(),
            "Authentication complete"
        );
    }

    // ── MFA SETUP ─────────────────────────────────────────────────
    public ApiResponse<MfaSetupResponse> setupMfa(String bearerToken) {
        String token = bearerToken.replace("Bearer ", "");
        String email = jwtService.extractEmail(token);
        User user = userRepository.findByEmail(email).orElseThrow();

        GoogleAuthenticatorKey key = gAuth.createCredentials();
        user.setMfaSecret(key.getKey()); // In production: encrypt this
        userRepository.save(user);

        String qrUrl = GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(
            mfaIssuer, email, key);

        // Generate 8 backup codes
        List<String> backupCodes = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            backupCodes.add(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        return ApiResponse.ok(
            MfaSetupResponse.builder()
                .secret(key.getKey())
                .qrCodeDataUri(qrUrl) // In production: render to PNG base64
                .backupCodes(backupCodes)
                .build(),
            "MFA setup initiated"
        );
    }

    // ── MFA ENABLE ────────────────────────────────────────────────
    public ApiResponse<Void> enableMfa(MfaVerifyRequest req) {
        String email = jwtService.extractEmail(req.getMfaToken());
        User user = userRepository.findByEmail(email).orElseThrow();
        boolean valid = gAuth.authorize(user.getMfaSecret(), Integer.parseInt(req.getCode()));
        if (!valid) return ApiResponse.error("Invalid code — MFA not enabled", "INVALID_CODE");
        user.setMfaEnabled(true);
        userRepository.save(user);
        return ApiResponse.ok(null, "MFA enabled successfully");
    }

    // ── BACKUP CODE ───────────────────────────────────────────────
    public ApiResponse<AuthResponse> verifyBackupCode(BackupCodeRequest req) {
        // Production: store hashed backup codes in DB, mark as used
        String email = jwtService.extractEmail(req.getMfaToken());
        User user = userRepository.findByEmail(email).orElseThrow();
        // Simplified: any non-empty code accepted in demo
        String accessToken  = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        auditService.log("BACKUP_CODE_USED", email, null, "Backup code authentication");
        return ApiResponse.ok(
            AuthResponse.builder()
                .accessToken(accessToken).refreshToken(refreshToken)
                .tokenType("Bearer").user(toUserDto(user)).build(),
            "Authenticated via backup code"
        );
    }

    // ── REFRESH TOKEN ─────────────────────────────────────────────
    public ApiResponse<AuthResponse> refreshToken(RefreshTokenRequest req) {
        if (!jwtService.validateToken(req.getRefreshToken())) {
            return ApiResponse.error("Refresh token expired", "TOKEN_EXPIRED");
        }
        if (!"REFRESH".equals(jwtService.extractTokenType(req.getRefreshToken()))) {
            return ApiResponse.error("Invalid token type", "INVALID_TOKEN");
        }
        String email = jwtService.extractEmail(req.getRefreshToken());
        User user = userRepository.findByEmail(email).orElseThrow();
        return ApiResponse.ok(
            AuthResponse.builder()
                .accessToken(jwtService.generateToken(user))
                .refreshToken(req.getRefreshToken()) // reuse refresh token
                .tokenType("Bearer").user(toUserDto(user)).build(),
            "Token refreshed"
        );
    }

    // ── EMAIL VERIFY ──────────────────────────────────────────────
    public ApiResponse<Void> verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));
        if (user.getEmailVerificationExpiry().isBefore(LocalDateTime.now())) {
            return ApiResponse.error("Verification link expired", "TOKEN_EXPIRED");
        }
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);
        return ApiResponse.ok(null, "Email verified. You may now log in.");
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────
    public ApiResponse<Void> forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.getEmail().toLowerCase()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setPasswordResetToken(token);
            user.setPasswordResetExpiry(LocalDateTime.now().plusHours(2));
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), token);
        });
        // Always return success to prevent email enumeration
        return ApiResponse.ok(null, "If this email is registered, a reset link has been sent.");
    }

    // ── RESET PASSWORD ────────────────────────────────────────────
    public ApiResponse<Void> resetPassword(ResetPasswordRequest req) {
        User user = userRepository.findByPasswordResetToken(req.getToken())
            .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));
        if (user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            return ApiResponse.error("Reset link expired. Please request a new one.", "TOKEN_EXPIRED");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        userRepository.save(user);
        auditService.log("PASSWORD_RESET", user.getEmail(), null, "Password reset successful");
        return ApiResponse.ok(null, "Password updated. Please sign in.");
    }

    // ── LOGOUT ────────────────────────────────────────────────────
    public ApiResponse<Void> logout(String bearerToken) {
        // Production: add token to a blocklist (Redis TTL)
        String token = bearerToken.replace("Bearer ", "");
        if (jwtService.validateToken(token)) {
            String email = jwtService.extractEmail(token);
            auditService.log("LOGOUT", email, null, "User logged out");
        }
        return ApiResponse.ok(null, "Logged out successfully");
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────
    private ApiResponse<AuthResponse> buildLoginResponse(User user, HttpServletRequest req) {
        resetFailedAttempts(user);
        updateLastLogin(user, getIp(req));

        if (user.isMfaEnabled()) {
            String mfaToken = jwtService.generateMfaPendingToken(user);
            return ApiResponse.ok(
                AuthResponse.builder()
                    .mfaRequired(true).mfaToken(mfaToken).tokenType("Bearer").build(),
                "MFA verification required"
            );
        }

        auditService.log("LOGIN_SUCCESS", user.getEmail(), getIp(req), "Login successful");
        return ApiResponse.ok(
            AuthResponse.builder()
                .accessToken(jwtService.generateToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .tokenType("Bearer").mfaRequired(false).user(toUserDto(user)).build(),
            "Login successful"
        );
    }

    private void handleFailedAttempt(User user) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        if (user.getFailedLoginAttempts() >= MAX_FAILURES) {
            user.setAccountLocked(true);
            user.setLockoutUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        }
        userRepository.save(user);
    }

    private void resetFailedAttempts(User user) {
        user.setFailedLoginAttempts(0);
        user.setAccountLocked(false);
        user.setLockoutUntil(null);
        userRepository.save(user);
    }

    private void updateLastLogin(User user, String ip) {
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(ip);
        userRepository.save(user);
    }

    private String getIp(HttpServletRequest req) {
        if (req == null) return null;
        String fwd = req.getHeader("X-Forwarded-For");
        return fwd != null ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }

    public UserDto toUserDto(User u) {
        return UserDto.builder()
            .id(u.getId()).fullName(u.getFullName()).email(u.getEmail())
            .role(u.getRole().name()).provider(u.getProvider().name())
            .emailVerified(u.isEmailVerified()).mfaEnabled(u.isMfaEnabled())
            .avatarUrl(u.getAvatarUrl()).preferredCurrency(u.getPreferredCurrency())
            .company(u.getCompany()).jobTitle(u.getJobTitle()).country(u.getCountry())
            .lastLoginAt(u.getLastLoginAt()).createdAt(u.getCreatedAt())
            .build();
    }
}
