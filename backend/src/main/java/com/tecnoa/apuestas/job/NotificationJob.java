package com.tecnoa.apuestas.job;

import com.tecnoa.apuestas.domain.model.Match;
import com.tecnoa.apuestas.domain.model.enums.MatchStatus;
import com.tecnoa.apuestas.domain.repository.GroupMemberRepository;
import com.tecnoa.apuestas.domain.repository.MatchRepository;
import com.tecnoa.apuestas.domain.repository.PredictionRepository;
import com.tecnoa.apuestas.infrastructure.fcm.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
public class NotificationJob {

    private static final Logger log = LoggerFactory.getLogger(NotificationJob.class);

    private final MatchRepository matchRepository;
    private final PredictionRepository predictionRepository;
    private final GroupMemberRepository memberRepository;
    private final PushNotificationService pushService;

    public NotificationJob(MatchRepository matchRepository, PredictionRepository predictionRepository,
                           GroupMemberRepository memberRepository, PushNotificationService pushService) {
        this.matchRepository = matchRepository;
        this.predictionRepository = predictionRepository;
        this.memberRepository = memberRepository;
        this.pushService = pushService;
    }

    // Every minute: notify users whose prediction window closes in ~60 minutes
    @Scheduled(cron = "0 * * * * *")
    public void sendPredictionReminders() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime windowStart = now.plusMinutes(55);
        OffsetDateTime windowEnd = now.plusMinutes(65);

        // Find SCHEDULED matches starting in ~60min (before deadline window)
        List<Match> upcoming = matchRepository.findByStatus("SCHEDULED")
                .stream()
                .filter(m -> {
                    OffsetDateTime scheduled = m.getScheduledAt();
                    return scheduled.isAfter(windowStart) && scheduled.isBefore(windowEnd);
                })
                .toList();

        for (Match match : upcoming) {
            String matchTitle = match.getHomeTeam().getShortName() + " vs " + match.getAwayTeam().getShortName();

            // For each betting group associated with this tournament, notify members without prediction
            memberRepository.findByTournamentIdAndUserId(match.getTournament().getId(), null); // simplified

            // Note: For a complete implementation, iterate over groups with this tournament
            // and for each member without a prediction, send the reminder.
            // Full query would be:
            // SELECT gm.user_id FROM group_members gm
            // JOIN betting_groups bg ON gm.group_id = bg.id
            // WHERE bg.tournament_id = :tid
            // AND NOT EXISTS (SELECT 1 FROM predictions p
            //   WHERE p.match_id = :mid AND p.group_id = bg.id AND p.user_id = gm.user_id)

            log.debug("Reminder window for match: {}", matchTitle);
        }
    }
}
