package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.api.dto.request.WildcardsRequest;
import com.tecnoa.apuestas.api.dto.response.WildcardResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.api.exception.ErrorCode;
import com.tecnoa.apuestas.domain.model.*;
import com.tecnoa.apuestas.domain.model.enums.TournamentStatus;
import com.tecnoa.apuestas.domain.model.enums.WildcardType;
import com.tecnoa.apuestas.domain.repository.*;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WildcardService {

    private static final Logger log = LoggerFactory.getLogger(WildcardService.class);

    private static final Map<WildcardType, String> LABELS = Map.of(
            WildcardType.FINALIST_1, "Selección a la final #1",
            WildcardType.FINALIST_2, "Selección a la final #2",
            WildcardType.BEST_PLAYER, "Mejor jugador",
            WildcardType.BEST_GOALKEEPER, "Mejor portero",
            WildcardType.TOP_SCORER, "Goleador del torneo"
    );

    private final WildcardRepository wildcardRepository;
    private final BettingGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public WildcardService(WildcardRepository wildcardRepository, BettingGroupRepository groupRepository,
                           GroupMemberRepository memberRepository, TeamRepository teamRepository,
                           UserRepository userRepository) {
        this.wildcardRepository = wildcardRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    public List<WildcardResponse> getMyWildcards(UUID groupId, UserPrincipal principal) {
        requireMember(groupId, principal.getUserId());
        BettingGroup group = requireWildcardsEnabled(groupId);
        List<Wildcard> existing = wildcardRepository.findByGroupIdAndUserId(groupId, principal.getUserId());
        boolean hasSubmitted = existing.stream()
                .anyMatch(w -> w.getTeam() != null || (w.getPlayerName() != null && !w.getPlayerName().isBlank()));
        boolean groupLocked = group.getTournament().getStatus() != TournamentStatus.SCHEDULED;
        boolean isLocked = hasSubmitted || groupLocked;
        return existing.stream().map(w -> toDto(w, isLocked)).toList();
    }

    @Transactional
    public List<WildcardResponse> updateWildcards(UUID groupId, WildcardsRequest req, UserPrincipal principal) {
        UUID userId = principal.getUserId();
        log.info("updateWildcards called - groupId={}, userId={}", groupId, userId);
        requireMember(groupId, userId);
        BettingGroup group = requireWildcardsEnabled(groupId);

        // Check if user already submitted wildcards - once saved, cannot be modified
        List<Wildcard> existing = wildcardRepository.findByGroupIdAndUserId(groupId, userId);
        log.info("Found {} existing wildcards for update check", existing.size());
        for (Wildcard w : existing) {
            log.info("  Existing: type={}, teamId={}, playerName={}",
                    w.getType(), w.getTeam() != null ? w.getTeam().getId() : null, w.getPlayerName());
        }
        boolean alreadySubmitted = existing.stream()
                .anyMatch(w -> (w.getTeam() != null || (w.getPlayerName() != null && !w.getPlayerName().isBlank())));
        log.info("alreadySubmitted={}", alreadySubmitted);
        if (alreadySubmitted) {
            log.warn("User {} attempted to update already submitted wildcards in group {}", userId, groupId);
            throw new AppException(ErrorCode.WILDCARDS_LOCKED, "Wildcards already submitted and cannot be modified");
        }

        if (group.getTournament().getStatus() != TournamentStatus.SCHEDULED) {
            throw new AppException(ErrorCode.WILDCARDS_LOCKED, "Wildcards are locked once the tournament starts");
        }

        User user = userRepository.getReferenceById(userId);

        for (WildcardsRequest.WildcardEntry entry : req.wildcards()) {
            Wildcard wc = wildcardRepository
                    .findByGroupIdAndUserIdAndType(groupId, userId, entry.type())
                    .orElseGet(() -> {
                        Wildcard w = new Wildcard();
                        w.setGroup(group);
                        w.setUser(user);
                        w.setType(entry.type());
                        return w;
                    });

            if (entry.type() == WildcardType.FINALIST_1 || entry.type() == WildcardType.FINALIST_2) {
                if (entry.teamId() == null) throw new AppException(ErrorCode.MATCH_NOT_FOUND, "teamId required for FINALIST");
                Team team = teamRepository.findById(entry.teamId())
                        .orElseThrow(() -> new AppException(ErrorCode.MATCH_NOT_FOUND, "Team not found"));
                wc.setTeam(team);
            } else {
                if (entry.playerName() == null || entry.playerName().isBlank()) {
                    throw new AppException(ErrorCode.MATCH_NOT_FOUND, "playerName required for " + entry.type());
                }
                wc.setPlayerName(entry.playerName());
            }
            wildcardRepository.save(wc);
        }

        List<Wildcard> saved = wildcardRepository.findByGroupIdAndUserId(groupId, userId);
        boolean hasSubmitted = saved.stream()
                .anyMatch(w -> w.getTeam() != null || (w.getPlayerName() != null && !w.getPlayerName().isBlank()));
        boolean groupLocked = group.getTournament().getStatus() != TournamentStatus.SCHEDULED;
        boolean isLocked = hasSubmitted || groupLocked;
        return saved.stream().map(w -> toDto(w, isLocked)).toList();
    }

    private BettingGroup requireWildcardsEnabled(UUID groupId) {
        BettingGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND, "Group not found"));
        if (!group.isWildcardsEnabled()) {
            throw new AppException(ErrorCode.GROUP_NOT_FOUND, "Wildcards not enabled for this group");
        }
        return group;
    }

    private void requireMember(UUID groupId, UUID userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new AppException(ErrorCode.NOT_GROUP_MEMBER, "Not a member of this group");
        }
    }

    private WildcardResponse toDto(Wildcard w, boolean isLocked) {
        return new WildcardResponse(
                w.getId(), w.getType(), LABELS.getOrDefault(w.getType(), w.getType().name()),
                w.getTeam() != null ? w.getTeam().getId() : null,
                w.getTeam() != null ? w.getTeam().getName() : null,
                w.getPlayerName(), 5, w.getPointsEarned(), isLocked
        );
    }
}
