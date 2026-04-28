package com.portfolio.service;

import com.portfolio.dto.AuthDTO.*;
import com.portfolio.entity.User;
import com.portfolio.exception.BadRequestException;
import com.portfolio.repository.UserRepository;
import com.portfolio.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private EmailService emailService;

    // In-memory OTP stores (email -> otp)
    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final Map<String, String> resetOtpStore = new ConcurrentHashMap<>();
    // MFA OTP store for login (email -> otp) — populated after password check
    private final Map<String, String> loginOtpStore = new ConcurrentHashMap<>();

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .middleName(request.getMiddleName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("admin".equalsIgnoreCase(request.getRole()) ? User.Role.ADMIN : User.Role.STUDENT)
                .build();

        userRepository.save(user);
        log.info("New user registered: {} ({})", user.getEmail(), user.getRole());

        String fullName = user.getFirstName() + " " + user.getLastName();
        emailService.sendWelcomeEmail(user.getEmail(), fullName);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getRole().name().toLowerCase(), user.getId(), fullName, user.getEmail());
    }

    /**
     * Step 1 of MFA login: validate email + password, then send OTP to registered email.
     * Does NOT return a JWT yet.
     */
    public void loginSendOtp(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Password is correct — generate and send login OTP
        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);
        loginOtpStore.put(request.getEmail(), otp);
        emailService.sendLoginOtpEmail(request.getEmail(), otp);
        log.info("Login MFA OTP sent to: {}", request.getEmail());
    }

    /**
     * Step 2 of MFA login: verify OTP and return JWT token.
     */
    public AuthResponse loginVerifyOtp(String email, String otp) {
        String stored = loginOtpStore.get(email);
        if (stored == null || !stored.equals(otp)) {
            throw new BadRequestException("Invalid or expired MFA code");
        }
        loginOtpStore.remove(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());
        String fullName = user.getFirstName() + " " + user.getLastName();
        log.info("User logged in with MFA: {}", user.getEmail());
        return new AuthResponse(token, user.getRole().name().toLowerCase(), user.getId(), fullName, user.getEmail());
    }

    /**
     * Legacy direct login (kept for backward compatibility / admin tooling).
     */
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());
        String fullName = user.getFirstName() + " " + user.getLastName();
        log.info("User logged in: {}", user.getEmail());
        return new AuthResponse(token, user.getRole().name().toLowerCase(), user.getId(), fullName, user.getEmail());
    }

    public void sendOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }
        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);
        otpStore.put(email, otp);
        emailService.sendOtpEmail(email, otp);
        log.info("OTP sent to: {}", email);
    }

    public void verifyOtp(String email, String otp) {
        String stored = otpStore.get(email);
        if (stored == null || !stored.equals(otp)) {
            throw new BadRequestException("Invalid or expired OTP");
        }
        otpStore.remove(email);
    }

    public void sendPasswordResetOtp(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email not registered"));
        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);
        resetOtpStore.put(email, otp);
        emailService.sendPasswordResetEmail(email, otp);
        log.info("Password reset OTP sent to: {}", email);
    }

    public void resetPassword(String email, String otp, String newPassword) {
        String stored = resetOtpStore.get(email);
        if (stored == null || !stored.equals(otp)) {
            throw new BadRequestException("Invalid or expired OTP");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetOtpStore.remove(email);
        log.info("Password reset for: {}", email);
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for userId: {}", userId);
    }
}
