package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.Wildcard;
import com.tecnoa.apuestas.domain.model.enums.WildcardType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WildcardRepository extends JpaRepository<Wildcard, UUID> {
    List<Wildcard> findByGroupIdAndUserId(UUID groupId, UUID userId);
    Optional<Wildcard> findByGroupIdAndUserIdAndType(UUID groupId, UUID userId, WildcardType type);
    List<Wildcard> findByGroupId(UUID groupId);
    void deleteByGroupId(UUID groupId);
}
