package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PredictionRepository extends JpaRepository<Prediction, UUID> {
    Optional<Prediction> findByGroupIdAndMatchIdAndUserId(UUID groupId, UUID matchId, UUID userId);
    List<Prediction> findByGroupIdAndUserId(UUID groupId, UUID userId);
    List<Prediction> findByMatchId(UUID matchId);

    @Query("SELECT p FROM Prediction p WHERE p.match.id = :matchId AND p.pointsEarned IS NULL")
    List<Prediction> findUnscored(@Param("matchId") UUID matchId);

    boolean existsByGroupIdAndMatchIdAndUserId(UUID groupId, UUID matchId, UUID userId);

    @Query("SELECT p FROM Prediction p WHERE p.match.id = :matchId AND p.group.id = :groupId")
    List<Prediction> findByMatchIdAndGroupId(@Param("matchId") UUID matchId, @Param("groupId") UUID groupId);
}
