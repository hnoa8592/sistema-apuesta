package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.FcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface FcmTokenRepository extends JpaRepository<FcmToken, UUID> {
    Optional<FcmToken> findByUserId(UUID userId);
}
