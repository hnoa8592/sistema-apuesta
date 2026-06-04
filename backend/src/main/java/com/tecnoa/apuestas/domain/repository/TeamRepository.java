package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    Optional<Team> findByExternalId(String externalId);

    @Query("SELECT DISTINCT m.homeTeam FROM Match m WHERE m.tournament.id = :tournamentId UNION SELECT DISTINCT m.awayTeam FROM Match m WHERE m.tournament.id = :tournamentId")
    List<Team> findByTournamentId(@Param("tournamentId") UUID tournamentId);
}
