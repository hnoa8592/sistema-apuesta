package com.tecnoa.apuestas.api.dto.response;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PredictionResponse(
        UUID id, UUID matchId, UUID groupId,
        short homeScorePred, short awayScorePred,
        Short pointsEarned, OffsetDateTime submittedAt
) {}
