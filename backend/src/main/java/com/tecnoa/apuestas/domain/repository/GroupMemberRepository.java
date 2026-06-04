package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {
    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);
    List<GroupMember> findByGroupIdOrderByTotalPointsDesc(UUID groupId);
    long countByGroupId(UUID groupId);
    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);
    void deleteByGroupId(UUID groupId);

    @Query("SELECT gm FROM GroupMember gm JOIN gm.group g WHERE g.tournament.id = :tournamentId AND gm.user.id = :userId")
    List<GroupMember> findByTournamentIdAndUserId(@Param("tournamentId") UUID tournamentId,
                                                   @Param("userId") UUID userId);
}
