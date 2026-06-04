package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.Wildcard;
import com.tecnoa.apuestas.domain.model.enums.WildcardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WildcardRepository extends JpaRepository<Wildcard, UUID> {
    @Query("SELECT w FROM Wildcard w LEFT JOIN FETCH w.team WHERE w.group.id = :groupId AND w.user.id = :userId")
    List<Wildcard> findByGroupIdAndUserIdWithTeam(@Param("groupId") UUID groupId, @Param("userId") UUID userId);

    List<Wildcard> findByGroupIdAndUserId(UUID groupId, UUID userId);
    Optional<Wildcard> findByGroupIdAndUserIdAndType(UUID groupId, UUID userId, WildcardType type);
    List<Wildcard> findByGroupId(UUID groupId);
    void deleteByGroupId(UUID groupId);
}
