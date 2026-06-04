package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.domain.model.*;
import com.tecnoa.apuestas.domain.model.enums.MatchStage;
import com.tecnoa.apuestas.domain.model.enums.MatchStatus;
import com.tecnoa.apuestas.domain.repository.*;
import com.tecnoa.apuestas.infrastructure.fcm.PushNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ScoringServiceTest {

    @Mock PredictionRepository predictionRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock MatchRepository matchRepository;
    @Mock PushNotificationService pushService;

    ScoringService scoringService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        scoringService = new ScoringService(predictionRepository, groupMemberRepository,
                matchRepository, pushService);
    }

    @ParameterizedTest(name = "Stage={0} home={1}-{2} pred={3}-{4} expected={5}")
    @CsvSource({
        // GROUP: exact = 3, correct = 1
        "GROUP, 2, 1, 2, 1, 3",   // exact
        "GROUP, 2, 1, 3, 2, 1",   // correct result (home wins)
        "GROUP, 1, 1, 0, 0, 1",   // correct result (draw)
        "GROUP, 2, 1, 0, 1, 0",   // wrong

        // ROUND_OF_16: exact = 5, correct = 3
        "ROUND_OF_16, 1, 0, 1, 0, 5",
        "ROUND_OF_16, 1, 0, 2, 0, 3",
        "ROUND_OF_16, 1, 0, 0, 1, 0",

        // QUARTER_FINAL: exact = 8, correct = 5
        "QUARTER_FINAL, 0, 0, 0, 0, 8",
        "QUARTER_FINAL, 0, 0, 1, 1, 5",
        "QUARTER_FINAL, 0, 0, 1, 0, 0",

        // SEMI_FINAL: exact = 10, correct = 7
        "SEMI_FINAL, 3, 1, 3, 1, 10",
        "SEMI_FINAL, 3, 1, 2, 0, 7",
        "SEMI_FINAL, 3, 1, 0, 2, 0",

        // THIRD_PLACE: exact = 12, correct = 8
        "THIRD_PLACE, 2, 0, 2, 0, 12",
        "THIRD_PLACE, 2, 0, 1, 0, 8",

        // FINAL: exact = 15, correct = 10
        "FINAL, 1, 0, 1, 0, 15",
        "FINAL, 1, 0, 2, 0, 10",
        "FINAL, 1, 0, 0, 1, 0",
    })
    void computePoints_allStagesAndCases(MatchStage stage, short homeReal, short awayReal,
                                         short homePred, short awayPred, short expected) {
        UUID matchId = UUID.randomUUID();
        Match match = buildFinishedMatch(matchId, stage, homeReal, awayReal);
        Prediction pred = buildPrediction(match, homePred, awayPred);

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(predictionRepository.findUnscored(matchId)).thenReturn(List.of(pred));
        when(groupMemberRepository.findByGroupIdAndUserId(any(), any())).thenReturn(Optional.empty());
        when(groupMemberRepository.findByGroupIdOrderByTotalPointsDesc(any())).thenReturn(List.of());

        scoringService.calculatePoints(matchId);

        assertThat(pred.getPointsEarned()).isEqualTo(expected);
    }

    @Test
    void penalties_usesFullTimeScore_notPenaltyScore() {
        UUID matchId = UUID.randomUUID();
        // Real score after 90min: 1-1 (then decided by penalties), pred: 1-1 → should get exact points
        Match match = buildFinishedMatch(matchId, MatchStage.ROUND_OF_16, (short) 1, (short) 1);
        match.setDecidedByPenalties(true);
        Prediction pred = buildPrediction(match, (short) 1, (short) 1);

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(predictionRepository.findUnscored(matchId)).thenReturn(List.of(pred));
        when(groupMemberRepository.findByGroupIdAndUserId(any(), any())).thenReturn(Optional.empty());
        when(groupMemberRepository.findByGroupIdOrderByTotalPointsDesc(any())).thenReturn(List.of());

        scoringService.calculatePoints(matchId);

        assertThat(pred.getPointsEarned()).isEqualTo((short) 5); // ROUND_OF_16 exact = 5
    }

    @Test
    void noScore_matchWithNullScore_doesNothing() {
        UUID matchId = UUID.randomUUID();
        Match match = new Match();
        match.setStatus(MatchStatus.IN_PROGRESS);

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));

        scoringService.calculatePoints(matchId);

        verifyNoInteractions(predictionRepository);
    }

    private Match buildFinishedMatch(UUID id, MatchStage stage, short home, short away) {
        Match m = new Match();
        m.setStatus(MatchStatus.FINISHED);
        m.setStage(stage);
        m.setHomeScore(home);
        m.setAwayScore(away);
        m.setHomeTeam(team("HOME"));
        m.setAwayTeam(team("AWY"));
        return m;
    }

    private Prediction buildPrediction(Match match, short home, short away) {
        BettingGroup group = new BettingGroup();
        User user = new User();
        Prediction p = new Prediction();
        p.setMatch(match);
        p.setGroup(group);
        p.setUser(user);
        p.setHomeScorePred(home);
        p.setAwayScorePred(away);
        return p;
    }

    private Team team(String shortName) {
        Team t = new Team();
        t.setShortName(shortName);
        t.setName(shortName);
        return t;
    }
}
