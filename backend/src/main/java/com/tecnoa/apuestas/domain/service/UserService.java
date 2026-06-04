package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.api.dto.request.UpdateUserRequest;
import com.tecnoa.apuestas.api.dto.response.AuthResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.api.exception.ErrorCode;
import com.tecnoa.apuestas.config.AppProperties;
import com.tecnoa.apuestas.domain.model.EmailVerification;
import com.tecnoa.apuestas.domain.model.User;
import com.tecnoa.apuestas.domain.repository.EmailVerificationRepository;
import com.tecnoa.apuestas.domain.repository.UserRepository;
import com.tecnoa.apuestas.infrastructure.email.EmailService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository verificationRepository;
    private final EmailService emailService;
    private final AppProperties props;

    public UserService(UserRepository userRepository, EmailVerificationRepository verificationRepository,
                       EmailService emailService, AppProperties props) {
        this.userRepository = userRepository;
        this.verificationRepository = verificationRepository;
        this.emailService = emailService;
        this.props = props;
    }

    public AuthResponse.UserResponse getProfile(UserPrincipal principal) {
        User user = getUser(principal.getUserId());
        return toDto(user);
    }

    @Transactional
    public AuthResponse.UserResponse updateProfile(UserPrincipal principal, UpdateUserRequest request) {
        User user = getUser(principal.getUserId());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.contactEmail() != null && !request.contactEmail().equals(user.getContactEmail())) {
            user.setContactEmail(request.contactEmail());
            user.setEmailVerified(false);
        }
        userRepository.save(user);
        return toDto(user);
    }

    @Transactional
    public void sendVerificationEmail(UserPrincipal principal) {
        User user = getUser(principal.getUserId());
        if (user.getContactEmail() == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND, "Contact email not configured. Update profile first.");
        }

        verificationRepository.deleteByUserId(user.getId());

        EmailVerification ev = new EmailVerification();
        ev.setUser(user);
        ev.setEmail(user.getContactEmail());
        ev.setToken(UUID.randomUUID().toString().replace("-", ""));
        ev.setExpiresAt(OffsetDateTime.now().plusHours(props.mail().tokenExpiryHours()));
        verificationRepository.save(ev);

        emailService.sendVerificationEmail(user.getContactEmail(), user.getName(), ev.getToken());
    }

    @Transactional
    public String confirmVerification(String token) {
        EmailVerification ev = verificationRepository.findByToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN, "Token not found"));

        if (ev.isExpired()) throw new AppException(ErrorCode.TOKEN_EXPIRED, "Verification link has expired");
        if (ev.isVerified()) return "already-verified";

        ev.setVerifiedAt(OffsetDateTime.now());
        verificationRepository.save(ev);

        User user = ev.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        return "verified";
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));
    }

    private AuthResponse.UserResponse toDto(User u) {
        return new AuthResponse.UserResponse(
                u.getId(), u.getName(), u.getEmail(), u.getPictureUrl(),
                u.isEmailVerified(), u.isProfileComplete()
        );
    }
}
