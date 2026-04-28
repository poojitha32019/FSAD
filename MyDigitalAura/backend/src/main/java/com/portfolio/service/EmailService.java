package com.portfolio.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendLoginOtpEmail(String to, String otp) {
        if (mailSender == null) {
            log.warn("[EMAIL NOT CONFIGURED] Login MFA OTP for {}: {}", to, otp);
            throw new RuntimeException("Email service not configured. Please contact admin.");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("MyDigitalAura - Login Verification Code (MFA)");
            message.setText(
                "Your login verification code is: " + otp + "\n\n" +
                "This code is valid for 10 minutes.\n\n" +
                "If you did not attempt to log in, please change your password immediately.\n\n" +
                "MyDigitalAura Team"
            );
            mailSender.send(message);
            log.info("Login MFA OTP email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send login MFA OTP email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send MFA code. Please check your email and try again.");
        }
    }

    public void sendOtpEmail(String to, String otp) {
        if (mailSender == null) {
            log.warn("[EMAIL NOT CONFIGURED] OTP for {}: {}", to, otp);
            throw new RuntimeException("Email service not configured. Please contact admin.");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("MyDigitalAura - Email Verification OTP");
            message.setText("Your OTP for email verification is: " + otp + "\n\nThis OTP is valid for 10 minutes.\n\nMyDigitalAura Team");
            mailSender.send(message);
            log.info("OTP email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send OTP. Please check your email and try again.");
        }
    }

    public void sendWelcomeEmail(String to, String name) {
        if (mailSender == null) {
            log.info("[DEV MODE] Email not configured. Welcome email for: {} ({})", to, name);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Welcome to MyDigitalAura!");
            message.setText("Hi " + name + ",\n\nWelcome to MyDigitalAura - Your Academic Portfolio Platform!\n\nStart building your portfolio today.\n\nMyDigitalAura Team");
            mailSender.send(message);
            log.info("Welcome email sent to {}", to);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}", to);
            log.error("Email error: {}", e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String otp) {
        if (mailSender == null) {
            log.info("[DEV MODE] Email not configured. Password reset OTP for {}: {}", to, otp);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("MyDigitalAura - Password Reset OTP");
            message.setText("Your OTP for password reset is: " + otp + "\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nMyDigitalAura Team");
            mailSender.send(message);
            log.info("Password reset OTP sent to {}", to);
        } catch (Exception e) {
            log.warn("Failed to send password reset email to {}. OTP: {}", to, otp);
            log.error("Email error: {}", e.getMessage());
        }
    }

    public void sendFeedbackNotification(String to, String studentName, String projectTitle) {
        if (mailSender == null) {
            log.info("[DEV MODE] Email not configured. Feedback notification for {} about project: {}", to, projectTitle);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("New Feedback on Your Project - MyDigitalAura");
            message.setText("Hi " + studentName + ",\n\nYou have received new feedback on your project: " + projectTitle + "\n\nLogin to MyDigitalAura to view the feedback.\n\nMyDigitalAura Team");
            mailSender.send(message);
            log.info("Feedback notification sent to {}", to);
        } catch (Exception e) {
            log.warn("Failed to send feedback notification to {}", to);
            log.error("Email error: {}", e.getMessage());
        }
    }
}
