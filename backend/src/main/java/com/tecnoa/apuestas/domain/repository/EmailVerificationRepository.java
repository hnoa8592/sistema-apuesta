package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, UUID> {
    Optional<EmailVerification> findByToken(String token);
    Optional<EmailVerification> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}