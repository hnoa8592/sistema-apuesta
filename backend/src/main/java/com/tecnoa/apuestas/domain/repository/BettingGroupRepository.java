package com.tecnoa.apuestas.domain.repository;

import com.tecnoa.apuestas.domain.model.BettingGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BettingGroupRepository extends JpaRepository<BettingGroup, UUID> {
    Optional<BettingGroup> findByInviteCode(String inviteCode);

    @Query("SELECT g FROM BettingGroup g JOIN g.organizer o WHERE o.id = :userId")
    List<BettingGroup> findByOrganizerId(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT g FROM BettingGroup g JOIN FETCH g.tournament JOIN FETCH g.organizer WHERE g.id = :groupId")
    Optional<BettingGroup> findByIdWithDetails(@Param("groupId") UUID groupId);

    @Query("SELECT DISTINCT g FROM BettingGroup g JOIN FETCH g.tournament JOIN FETCH g.organizer WHERE g.id IN (SELECT gm.group.id FROM GroupMember gm WHERE gm.user.id = :userId)")
    List<BettingGroup> findGroupsByMemberIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT g FROM BettingGroup g JOIN FETCH g.tournament JOIN FETCH g.organizer WHERE g.isOpen = true AND g.status IN ('OPEN','ACTIVE') ORDER BY g.createdAt DESC")
    List<BettingGroup> findPublicGroups();

    @Query("SELECT DISTINCT g FROM BettingGroup g JOIN FETCH g.tournament JOIN FETCH g.organizer WHERE g.isOpen = false AND g.status IN ('OPEN','ACTIVE') ORDER BY g.createdAt DESC")
    List<BettingGroup> findPrivateGroups();
}
