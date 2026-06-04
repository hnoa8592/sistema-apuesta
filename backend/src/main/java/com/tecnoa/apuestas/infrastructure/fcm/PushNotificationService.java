package com.tecnoa.apuestas.infrastructure.fcm;

import com.google.firebase.messaging.*;
import com.tecnoa.apuestas.domain.repository.FcmTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final FcmTokenRepository fcmTokenRepository;

    public PushNotificationService(FcmTokenRepository fcmTokenRepository) {
        this.fcmTokenRepository = fcmTokenRepository;
    }

    @Async
    public void sendPredictionReminder(UUID userId, String matchTitle, String closesIn) {
        send(userId, "⏰ ¡Pronostica ya!",
                matchTitle + " cierra en " + closesIn, "PREDICTION_REMINDER");
    }

    @Async
    public void sendMatchResultNotification(UUID userId, String matchTitle, int points) {
        send(userId, "⚽ Resultado calculado",
                "Ganaste " + points + " pts en " + matchTitle, "MATCH_RESULT");
    }

    @Async
    public void sendTournamentStart(UUID userId, String tournamentName) {
        send(userId, "🏆 ¡Arranca el torneo!",
                tournamentName + " ya comenzó. ¡Pronostica!", "TOURNAMENT_START");
    }

    private void send(UUID userId, String title, String body, String type) {
        fcmTokenRepository.findByUserId(userId).ifPresent(fcmToken -> {
            try {
                Message message = Message.builder()
                        .setToken(fcmToken.getToken())
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putData("type", type)
                        .build();
                FirebaseMessaging.getInstance().send(message);
            } catch (FirebaseMessagingException e) {
                log.warn("FCM send failed for user {}: {}", userId, e.getMessage());
            }
        });
    }
}
