package com.tecnoa.apuestas.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        AppConfig app,
        JwtProperties jwt,
        GoogleProperties google,
        FootballDataProperties footballData,
        MailProperties mail,
        FcmProperties fcm
) {
    public record AppConfig(String baseUrl) {}
    public record JwtProperties(String secret, int expirationDays) {}
    public record GoogleProperties(String clientId) {}
    public record MailProperties(String from, String verificationUrl, int tokenExpiryHours) {}
    public record FcmProperties(String credentialsFile) {}

    public record FootballDataProperties(
            String apiKey,
            String baseUrl,
            List<CompetitionConfig> supportedCompetitions
    ) {
        public record CompetitionConfig(String code, String type, boolean hasPhases) {}
    }
}
