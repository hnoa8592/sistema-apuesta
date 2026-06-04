package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.Match;
import com.tecnoa.apuestas.domain.model.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MatchRepository extends JpaRepository<Match, UUID> {
    Optional<Match> findByExternalId(String externalId);
    List<Match> findByTournamentIdOrderByScheduledAt(UUID tournamentId);
    @Query(value = "SELECT * FROM matches m WHERE m.status = CAST(:status AS match_status)", nativeQuery = true)
    List<Match> findByStatus(@Param("status") String status);

    @Query(value = "SELECT * FROM matches m WHERE (m.status = CAST(:status1 AS match_status)) OR " +
                    "(m.status = CAST(:status2 AS match_status) AND m.scheduled_at <= :threshold)", nativeQuery = true)
    List<Match> findLiveOrStartingSoon(@Param("threshold") OffsetDateTime threshold,
                                      @Param("status1") String status1,
                                      @Param("status2") String status2);

    @Query("SELECT m FROM Match m WHERE m.tournament.id = :tournamentId AND m.status = :status ORDER BY m.scheduledAt")
    List<Match> findByTournamentIdAndStatus(@Param("tournamentId") UUID tournamentId,
                                            @Param("status") MatchStatus status);

    @Query("SELECT m FROM Match m WHERE m.status = 'FINISHED' ORDER BY m.scheduledAt DESC")
    List<Match> findFinishedMatches();
}
