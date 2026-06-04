package com.tecnoa.apuestas.domain.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.tecnoa.apuestas.api.dto.request.*;
import com.tecnoa.apuestas.api.dto.response.AuthResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.domain.model.*;
import com.tecnoa.apuestas.domain.repository.*;
import com.tecnoa.apuestas.infrastructure.security.GoogleTokenVerifier;
import com.tecnoa.apuestas.infrastructure.security.JwtService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import com.tecnoa.apuestas.infrastructure.email.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;
    private static final int PASSWORD_RESET_EXPIRY_HOURS = 1;
    private static final int EMAIL_VERIFY_EXPIRY_HOURS = 24;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final GoogleTokenVerifier googleTokenVerifier;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final FcmTokenRepository fcmTokenRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthService(GoogleTokenVerifier googleTokenVerifier, JwtService jwtService,
                       UserRepository userRepository, FcmTokenRepository fcmTokenRepository,
                       EmailVerificationRepository emailVerificationRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder, EmailService emailService) {
        this.googleTokenVerifier = googleTokenVerifier;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.fcmTokenRepository = fcmTokenRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.idToken());

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        User user = userRepository.findByGoogleId(googleId).orElseGet(() -> {
            User newUser = new User();
            newUser.setGoogleId(googleId);
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setPictureUrl(picture);
            newUser.setAuthMethod("GOOGLE");
            return newUser;
        });

        user.setName(name);
        user.setPictureUrl(picture);
        user.setLastLogin(OffsetDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(token, new AuthResponse.UserResponse(
                user.getId(), user.getName(), user.getEmail(), user.getPictureUrl(),
                user.isEmailVerified(), user.isProfileComplete()
        ));
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException("Email already registered", 400);
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setName(request.getName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthMethod("EMAIL");
        user = userRepository.save(user);

        // Generate email verification token
        String token = generateSecureToken();
        EmailVerification verification = new EmailVerification();
        verification.setUser(user);
        verification.setEmail(request.getEmail());
        verification.setToken(token);
        verification.setExpiresAt(OffsetDateTime.now().plusHours(EMAIL_VERIFY_EXPIRY_HOURS));
        emailVerificationRepository.save(verification);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);

        String jwt = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(jwt, new AuthResponse.UserResponse(
                user.getId(), user.getName(), user.getEmail(), null,
                false, false
        ));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException("Invalid credentials", 401));

        if ("GOOGLE".equals(user.getAuthMethod())) {
            throw new AppException("This account uses Google sign-in. Please use Google to login.", 400);
        }

        if (user.isLocked()) {
            throw new AppException("Account temporarily locked. Try again later.", 423);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setLoginAttempts(user.getLoginAttempts() + 1);
            if (user.getLoginAttempts() >= MAX_LOGIN_ATTEMPTS) {
                user.setLockedUntil(OffsetDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
            }
            userRepository.save(user);
            throw new AppException("Invalid credentials", 401);
        }

        // Reset on success
        user.setLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLogin(OffsetDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(token, new AuthResponse.UserResponse(
                user.getId(), user.getName(), user.getEmail(), user.getPictureUrl(),
                user.isEmailVerified(), user.isProfileComplete()
        ));
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            if (!"EMAIL".equals(user.getAuthMethod())) return; // Skip for Google accounts

            // Invalidate previous tokens
            passwordResetTokenRepository.deleteByUserId(user.getId());

            String token = generateSecureToken();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(token);
            resetToken.setExpiresAt(OffsetDateTime.now().plusHours(PASSWORD_RESET_EXPIRY_HOURS));
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
        });
        // Always return success to prevent email enumeration
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new AppException("Invalid or expired token", 400));

        if (resetToken.isExpired()) {
            throw new AppException("Token has expired", 400);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerification verification = emailVerificationRepository.findByToken(token)
                .orElseThrow(() -> new AppException("Invalid token", 400));

        if (verification.isExpired()) {
            throw new AppException("Token has expired", 400);
        }

        verification.setVerifiedAt(OffsetDateTime.now());
        emailVerificationRepository.save(verification);

        User user = verification.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void registerFcmToken(UserPrincipal principal, FcmTokenRequest request) {
        User user = userRepository.getReferenceById(principal.getUserId());
        FcmToken fcmToken = fcmTokenRepository.findByUserId(principal.getUserId())
                .orElseGet(() -> {
                    FcmToken t = new FcmToken();
                    t.setUser(user);
                    return t;
                });
        fcmToken.setToken(request.token());
        fcmToken.setUpdatedAt(OffsetDateTime.now());
        fcmTokenRepository.save(fcmToken);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}