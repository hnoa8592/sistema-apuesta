package com.tecnoa.apuestas.api.dto.response;

import com.tecnoa.apuestas.domain.model.enums.MatchStage;
import com.tecnoa.apuestas.domain.model.enums.MatchStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MatchResponse(
        UUID id, TeamSummary homeTeam, TeamSummary awayTeam,
        OffsetDateTime scheduledAt, MatchStage stage, String groupName,
        Short matchDay, MatchStatus status,
        Short homeScore, Short awayScore,
        boolean decidedByPenalties,
        int pointsForCorrectResult, int pointsForExactScore
) {
    public record TeamSummary(UUID id, String name, String shortName, String flagUrl) {}
}
