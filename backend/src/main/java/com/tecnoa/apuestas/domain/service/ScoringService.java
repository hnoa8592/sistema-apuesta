package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.domain.model.GroupMember;
import com.tecnoa.apuestas.domain.model.Match;
import com.tecnoa.apuestas.domain.model.Prediction;
import com.tecnoa.apuestas.domain.model.enums.MatchStage;
import com.tecnoa.apuestas.domain.repository.GroupMemberRepository;
import com.tecnoa.apuestas.domain.repository.MatchRepository;
import com.tecnoa.apuestas.domain.repository.PredictionRepository;
import com.tecnoa.apuestas.infrastructure.fcm.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ScoringService {

    private static final Logger log = LoggerFactory.getLogger(ScoringService.class);

    private final PredictionRepository predictionRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MatchRepository matchRepository;
    private final PushNotificationService pushService;

    public ScoringService(PredictionRepository predictionRepository,
                          GroupMemberRepository groupMemberRepository,
                          MatchRepository matchRepository,
                          PushNotificationService pushService) {
        this.predictionRepository = predictionRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.matchRepository = matchRepository;
        this.pushService = pushService;
    }

    @Transactional
    @CacheEvict(value = "leaderboard", allEntries = true)
    public void calculatePoints(UUID matchId) {
        Match match = matchRepository.findById(matchId).orElse(null);
        if (match == null || match.getHomeScore() == null || match.getAwayScore() == null) return;

        MatchStage stage = match.getStage();
        short homeScore = match.getHomeScore();
        short awayScore = match.getAwayScore();

        List<Prediction> predictions = predictionRepository.findUnscored(matchId);
        Set<UUID> affectedGroupIds = new HashSet<>();

        for (Prediction pred : predictions) {
            short pts = computePoints(stage, homeScore, awayScore, pred.getHomeScorePred(), pred.getAwayScorePred());
            pred.setPointsEarned(pts);

            GroupMember member = groupMemberRepository
                    .findByGroupIdAndUserId(pred.getGroup().getId(), pred.getUser().getId())
                    .orElse(null);
            if (member != null) {
                member.setTotalPoints(member.getTotalPoints() + pts);
                if (pts == stage.exactScore) member.setExactPredictions(member.getExactPredictions() + 1);
                else if (pts == stage.correctResult) member.setCorrectResults(member.getCorrectResults() + 1);
                groupMemberRepository.save(member);
                affectedGroupIds.add(pred.getGroup().getId());
            }
        }

        predictionRepository.saveAll(predictions);

        affectedGroupIds.forEach(id -> updatePositions(id));

        String matchTitle = match.getHomeTeam().getShortName() + " vs " + match.getAwayTeam().getShortName();
        predictions.forEach(pred -> {
            if (pred.getPointsEarned() != null) {
                pushService.sendMatchResultNotification(pred.getUser().getId(), matchTitle, pred.getPointsEarned());
            }
        });

        log.info("Scored {} predictions for match {}", predictions.size(), matchId);
    }

    private short computePoints(MatchStage stage, short homeReal, short awayReal,
                                short homePred, short awayPred) {
        if (homePred == homeReal && awayPred == awayReal) return (short) stage.exactScore;
        if (sign(homePred - awayPred) == sign(homeReal - awayReal)) return (short) stage.correctResult;
        return 0;
    }

    private int sign(int v) { return Integer.compare(v, 0); }

    private void updatePositions(UUID groupId) {
        List<GroupMember> members = groupMemberRepository.findByGroupIdOrderByTotalPointsDesc(groupId);
        for (int i = 0; i < members.size(); i++) {
            GroupMember m = members.get(i);
            m.setPreviousPosition(m.getCurrentPosition());
            m.setCurrentPosition((short) (i + 1));
            groupMemberRepository.save(m);
        }
    }

    @Transactional
    @CacheEvict(value = "leaderboard", allEntries = true)
    public void calculateAllPendingPoints() {
        List<Match> finishedMatches = matchRepository.findFinishedMatches();
        for (Match match : finishedMatches) {
            calculatePoints(match.getId());
        }
        log.info("Scoring completed for {} matches", finishedMatches.size());
    }
}
