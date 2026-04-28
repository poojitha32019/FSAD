package com.portfolio.controller;

import com.portfolio.dto.AuthDTO.*;
import com.portfolio.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Register, Login, MFA OTP")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register new user")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * MFA Login Step 1: validates credentials and sends OTP to registered email.
     */
    @PostMapping("/login/send-otp")
    @Operation(summary = "MFA Login Step 1 - Validate credentials and send OTP to registered email")
    public ResponseEntity<Map<String, String>> loginSendOtp(@Valid @RequestBody LoginRequest request) {
        authService.loginSendOtp(request);
        return ResponseEntity.ok(Map.of("message", "MFA code sent to your registered email"));
    }

    /**
     * MFA Login Step 2: verifies OTP and returns JWT token.
     */
    @PostMapping("/login/verify-otp")
    @Operation(summary = "MFA Login Step 2 - Verify OTP and get JWT token")
    public ResponseEntity<AuthResponse> loginVerifyOtp(@RequestBody Map<String, String> body) {
        AuthResponse response = authService.loginVerifyOtp(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Direct login (legacy - use /login/send-otp + /login/verify-otp for MFA)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP to email for registration verification")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody Map<String, String> body) {
        authService.sendOtp(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + body.get("email")));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP for email")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> body) {
        authService.verifyOtp(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send OTP for password reset")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        authService.sendPasswordResetOtp(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Password reset OTP sent to " + body.get("email")));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetPassword(body.get("email"), body.get("otp"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
