package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.Tournament;
import com.tecnoa.apuestas.domain.model.enums.TournamentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TournamentRepository extends JpaRepository<Tournament, UUID> {
    Optional<Tournament> findByExternalId(String externalId);
    @Query(value = "SELECT * FROM tournaments WHERE status IN ('SCHEDULED','IN_PROGRESS') ORDER BY start_date DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Tournament> findActiveTournaments(@Param("limit") int limit, @Param("offset") int offset);

    @Query(value = "SELECT COUNT(*) FROM tournaments WHERE status IN ('SCHEDULED','IN_PROGRESS')", nativeQuery = true)
    long countActiveTournaments();
}
