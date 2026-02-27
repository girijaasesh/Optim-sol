package com.agilepro.controller;

import com.agilepro.dto.*;
import com.agilepro.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User and Admin authentication endpoints")
public class AuthController {

    private final AuthService authService;

    // ── USER REGISTRATION ──────────────────────────────────────────
    @PostMapping("/register")
    @Operation(summary = "Register a new participant account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
        @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // ── USER LOGIN (email + password) ─────────────────────────────
    @PostMapping("/login")
    @Operation(summary = "Login with email and password (returns token or MFA challenge)")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    // ── ADMIN LOGIN ───────────────────────────────────────────────
    @PostMapping("/admin/login")
    @Operation(summary = "Admin login - always requires MFA")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.adminLogin(request, httpRequest));
    }

    // ── MFA VERIFY ────────────────────────────────────────────────
    @PostMapping("/mfa/verify")
    @Operation(summary = "Verify TOTP code after credential login")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyMfa(
        @Valid @RequestBody MfaVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyMfa(request));
    }

    // ── MFA SETUP (get QR code) ───────────────────────────────────
    @PostMapping("/mfa/setup")
    @Operation(summary = "Initialize MFA setup — returns TOTP secret and QR code")
    public ResponseEntity<ApiResponse<MfaSetupResponse>> setupMfa(
        @RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(authService.setupMfa(bearerToken));
    }

    // ── MFA ENABLE (confirm secret with first code) ───────────────
    @PostMapping("/mfa/enable")
    @Operation(summary = "Confirm and enable MFA with first valid TOTP code")
    public ResponseEntity<ApiResponse<Void>> enableMfa(
        @Valid @RequestBody MfaVerifyRequest request) {
        return ResponseEntity.ok(authService.enableMfa(request));
    }

    // ── BACKUP CODE LOGIN ─────────────────────────────────────────
    @PostMapping("/mfa/backup")
    @Operation(summary = "Login using a one-time backup code")
    public ResponseEntity<ApiResponse<AuthResponse>> backupCodeLogin(
        @Valid @RequestBody BackupCodeRequest request) {
        return ResponseEntity.ok(authService.verifyBackupCode(request));
    }

    // ── REFRESH TOKEN ─────────────────────────────────────────────
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
        @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    // ── EMAIL VERIFICATION ────────────────────────────────────────
    @GetMapping("/verify-email")
    @Operation(summary = "Verify email address via token link")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────
    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset link")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    // ── RESET PASSWORD ────────────────────────────────────────────
    @PostMapping("/reset-password")
    @Operation(summary = "Set new password using reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    // ── LOGOUT ────────────────────────────────────────────────────
    @PostMapping("/logout")
    @Operation(summary = "Invalidate session (client should discard tokens)")
    public ResponseEntity<ApiResponse<Void>> logout(
        @RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(authService.logout(bearerToken));
    }
}
