package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.api.dto.request.PredictionRequest;
import com.tecnoa.apuestas.api.dto.response.PredictionResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.api.exception.ErrorCode;
import com.tecnoa.apuestas.domain.model.*;
import com.tecnoa.apuestas.domain.model.enums.MatchStatus;
import com.tecnoa.apuestas.domain.repository.*;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PredictionService {

    private final PredictionRepository predictionRepository;
    private final BettingGroupRepository groupRepository;
    private final MatchRepository matchRepository;
    private final GroupMemberRepository memberRepository;
    private final UserRepository userRepository;

    public PredictionService(PredictionRepository predictionRepository,
                             BettingGroupRepository groupRepository,
                             MatchRepository matchRepository,
                             GroupMemberRepository memberRepository,
                             UserRepository userRepository) {
        this.predictionRepository = predictionRepository;
        this.groupRepository = groupRepository;
        this.matchRepository = matchRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    public List<PredictionResponse> getMyPredictions(UUID groupId, UserPrincipal principal) {
        requireMember(groupId, principal.getUserId());
        return predictionRepository.findByGroupIdAndUserId(groupId, principal.getUserId())
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public PredictionResponse submitPrediction(UUID groupId, PredictionRequest req, UserPrincipal principal) {
        UUID userId = principal.getUserId();
        requireMember(groupId, userId);

        BettingGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND, "Group not found"));

        Match match = matchRepository.findById(req.matchId())
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_NOT_FOUND, "Match not found"));

        if (!match.getTournament().getId().equals(group.getTournament().getId())) {
            throw new AppException(ErrorCode.MATCH_NOT_FOUND, "Match does not belong to this group's tournament");
        }

        OffsetDateTime deadline = match.getDeadlineAt(group.getPredictionDeadlineMinutes());
        if (OffsetDateTime.now().isAfter(deadline) || match.getStatus() != MatchStatus.SCHEDULED) {
            throw new AppException(ErrorCode.PREDICTION_DEADLINE_PASSED, "Prediction deadline has passed");
        }

        User user = userRepository.getReferenceById(userId);
        Prediction pred = predictionRepository
                .findByGroupIdAndMatchIdAndUserId(groupId, req.matchId(), userId)
                .orElseGet(() -> {
                    Prediction p = new Prediction();
                    p.setGroup(group);
                    p.setMatch(match);
                    p.setUser(user);
                    return p;
                });

        pred.setHomeScorePred(req.homeScore());
        pred.setAwayScorePred(req.awayScore());
        predictionRepository.save(pred);

        return toDto(pred);
    }

    public List<PredictionResponse> getMatchPredictions(UUID groupId, UUID matchId, UserPrincipal principal) {
        requireMember(groupId, principal.getUserId());

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_NOT_FOUND, "Match not found"));

        if (match.getStatus() == MatchStatus.SCHEDULED) {
            throw new AppException(ErrorCode.PREDICTION_DEADLINE_PASSED, "Predictions are only visible after match starts");
        }

        return predictionRepository.findByMatchIdAndGroupId(matchId, groupId)
                .stream().map(this::toDto).toList();
    }

    private void requireMember(UUID groupId, UUID userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new AppException(ErrorCode.NOT_GROUP_MEMBER, "Not a member of this group");
        }
    }

    private PredictionResponse toDto(Prediction p) {
        return new PredictionResponse(p.getId(), p.getMatch().getId(), p.getGroup().getId(),
                p.getHomeScorePred(), p.getAwayScorePred(), p.getPointsEarned(), p.getSubmittedAt());
    }
}
