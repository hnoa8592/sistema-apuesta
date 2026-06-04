package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.api.dto.request.CreateGroupRequest;
import com.tecnoa.apuestas.api.dto.request.JoinGroupRequest;
import com.tecnoa.apuestas.api.dto.response.GroupResponse;
import com.tecnoa.apuestas.api.dto.response.LeaderboardResponse;
import com.tecnoa.apuestas.api.dto.response.TournamentResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.api.exception.ErrorCode;
import com.tecnoa.apuestas.config.AppProperties;
import com.tecnoa.apuestas.domain.model.*;
import com.tecnoa.apuestas.domain.model.enums.GroupStatus;
import com.tecnoa.apuestas.domain.model.enums.MemberRole;
import com.tecnoa.apuestas.domain.model.enums.TournamentStatus;
import com.tecnoa.apuestas.domain.repository.*;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class GroupService {

    private final BettingGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final TournamentService tournamentService;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;

    public GroupService(BettingGroupRepository groupRepository, GroupMemberRepository memberRepository,
                        TournamentRepository tournamentRepository, UserRepository userRepository,
                        TournamentService tournamentService, PasswordEncoder passwordEncoder,
                        AppProperties props) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.tournamentService = tournamentService;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
    }

    @Transactional
    public GroupResponse createGroup(UserPrincipal principal, CreateGroupRequest req) {
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (!user.isProfileComplete()) {
            throw new AppException(ErrorCode.PROFILE_INCOMPLETE, "Complete email verification to create groups");
        }

        Tournament tournament = tournamentRepository.findById(req.tournamentId())
                .orElseThrow(() -> new AppException(ErrorCode.TOURNAMENT_NOT_FOUND, "Tournament not found"));

        BettingGroup group = new BettingGroup();
        group.setName(req.name());
        group.setTournament(tournament);
        group.setOrganizer(user);
        group.setMaxParticipants(req.maxParticipants());
        group.setOpen(req.isOpen());
        group.setPredictionDeadlineMinutes(req.predictionDeadlineMinutes());
        group.setWildcardsEnabled(req.wildcardsEnabled());
        group.setEntryFee(req.entryFee());
        group.setInviteCode(generateInviteCode(req.name()));

        if (req.password() != null && !req.password().isBlank()) {
            group.setPasswordHash(passwordEncoder.encode(req.password()));
        }

        group = groupRepository.save(group);

        GroupMember organizer = new GroupMember();
        organizer.setGroup(group);
        organizer.setUser(user);
        organizer.setRole(MemberRole.ORGANIZER);
        organizer.setCurrentPosition((short) 1);
        memberRepository.save(organizer);

        return toDto(group, 1, principal.getUserId());
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getMyGroups(UserPrincipal principal) {
        UUID userId = principal.getUserId();
        List<BettingGroup> groups = groupRepository.findGroupsByMemberIdWithDetails(userId);
        return groups.stream()
                .map(g -> toDto(g, (int) memberRepository.countByGroupId(g.getId()), userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getPublicGroups() {
        List<BettingGroup> groups = groupRepository.findPublicGroups();
        return groups.stream()
                .map(g -> toDto(g, (int) memberRepository.countByGroupId(g.getId()), null))
                .toList();
    }

    public GroupResponse getGroup(UUID groupId, UserPrincipal principal) {
        BettingGroup group = findOrThrowWithDetails(groupId);
        requireMember(groupId, principal.getUserId());
        return toDto(group, (int) memberRepository.countByGroupId(groupId), principal.getUserId());
    }

    @Transactional
    public GroupResponse joinGroup(UserPrincipal principal, JoinGroupRequest req) {
        BettingGroup group = groupRepository.findByInviteCode(req.inviteCode())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INVITE_CODE, "Invalid invite code"));

        UUID userId = principal.getUserId();

        if (memberRepository.existsByGroupIdAndUserId(group.getId(), userId)) {
            throw new AppException(ErrorCode.ALREADY_MEMBER, "Already a member of this group");
        }

        if (group.getStatus() == GroupStatus.FINISHED || group.getStatus() == GroupStatus.CANCELLED) {
            throw new AppException(ErrorCode.GROUP_ALREADY_STARTED, "Cannot join a finished group");
        }

        if (group.getMaxParticipants() != null &&
                memberRepository.countByGroupId(group.getId()) >= group.getMaxParticipants()) {
            throw new AppException(ErrorCode.GROUP_FULL, "Group is full");
        }

        if (group.getPasswordHash() != null) {
            if (req.password() == null || !passwordEncoder.matches(req.password(), group.getPasswordHash())) {
                throw new AppException(ErrorCode.WRONG_PASSWORD, "Incorrect password");
            }
        }

        User user = userRepository.getReferenceById(userId);
        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUser(user);
        member.setRole(MemberRole.PARTICIPANT);
        memberRepository.save(member);

        long count = memberRepository.countByGroupId(group.getId());
        return toDto(group, (int) count, userId);
    }

    @Transactional
    public void deleteGroup(UUID groupId, UserPrincipal principal) {
        BettingGroup group = findOrThrow(groupId);
        requireOrganizer(group, principal.getUserId());

        if (group.getTournament().getStatus() != TournamentStatus.SCHEDULED) {
            throw new AppException(ErrorCode.GROUP_ALREADY_STARTED, "Cannot delete group after tournament started");
        }

        memberRepository.deleteByGroupId(groupId);
        groupRepository.delete(group);
    }

    @Cacheable(value = "leaderboard", key = "#groupId")
    public LeaderboardResponse getLeaderboard(UUID groupId, UserPrincipal principal) {
        requireMember(groupId, principal.getUserId());
        List<GroupMember> members = memberRepository.findByGroupIdOrderByTotalPointsDesc(groupId);
        List<LeaderboardResponse.Entry> entries = new ArrayList<>();

        for (int i = 0; i < members.size(); i++) {
            GroupMember m = members.get(i);
            entries.add(new LeaderboardResponse.Entry(
                    i + 1, m.getUser().getId(), m.getUser().getName(),
                    m.getUser().getPictureUrl(), m.getTotalPoints(),
                    m.getExactPredictions(), m.getCorrectResults(),
                    m.getPositionTrend(),
                    m.getUser().getId().equals(principal.getUserId())
            ));
        }
        return new LeaderboardResponse(groupId, OffsetDateTime.now(), entries);
    }

    public Map<String, String> getInviteLink(UUID groupId, UserPrincipal principal) {
        BettingGroup group = findOrThrow(groupId);
        requireMember(groupId, principal.getUserId());
        String baseUrl = props.mail().verificationUrl().replace("/api/v1/users/verify-email", "");
        return Map.of(
                "inviteCode", group.getInviteCode(),
                "inviteUrl", baseUrl + "/join/" + group.getInviteCode()
        );
    }

    private BettingGroup findOrThrow(UUID id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND, "Group not found"));
    }

    private BettingGroup findOrThrowWithDetails(UUID id) {
        return groupRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND, "Group not found"));
    }

    private void requireMember(UUID groupId, UUID userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new AppException(ErrorCode.NOT_GROUP_MEMBER, "Not a member of this group");
        }
    }

    private void requireOrganizer(BettingGroup group, UUID userId) {
        if (!group.getOrganizer().getId().equals(userId)) {
            throw new AppException(ErrorCode.NOT_ORGANIZER, "Only the organizer can perform this action");
        }
    }

    private String generateInviteCode(String groupName) {
        String prefix = groupName.replaceAll("[^A-Za-z]", "").toUpperCase();
        prefix = prefix.length() >= 3 ? prefix.substring(0, 3) : "GRP";
        String year = String.valueOf(java.time.Year.now().getValue());
        String rand = UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
        String code = prefix + "-" + year + "-" + rand;
        // Ensure uniqueness (retry on collision)
        while (groupRepository.findByInviteCode(code).isPresent()) {
            rand = UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
            code = prefix + "-" + year + "-" + rand;
        }
        return code;
    }

    private GroupResponse toDto(BettingGroup g, int participantCount, UUID currentUserId) {
        TournamentResponse t = tournamentService.toDto(g.getTournament());
        String baseUrl = props.mail().verificationUrl().replace("/api/v1/users/verify-email", "");
        return new GroupResponse(
                g.getId(), g.getName(), t,
                new GroupResponse.OrganizerSummary(g.getOrganizer().getId(),
                        g.getOrganizer().getName(), g.getOrganizer().getPictureUrl()),
                g.getMaxParticipants(), g.isOpen(), g.isWildcardsEnabled(),
                g.getPredictionDeadlineMinutes(), g.getEntryFee(),
                g.getInviteCode(), baseUrl + "/join/" + g.getInviteCode(),
                g.getStatus(), participantCount, g.getCreatedAt()
        );
    }
}
