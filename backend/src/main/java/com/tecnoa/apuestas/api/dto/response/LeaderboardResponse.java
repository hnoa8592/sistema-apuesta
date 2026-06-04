package com.tecnoa.apuestas.api.dto.response;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record LeaderboardResponse(
        UUID groupId, OffsetDateTime updatedAt, List<Entry> entries
) {
    public record Entry(
            int position, UUID userId, String name, String pictureUrl,
            int totalPoints, int exactPredictions, int correctResults,
            int positionTrend, boolean isCurrentUser
    ) {}
}
