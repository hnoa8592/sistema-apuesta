package com.tecnoa.apuestas.api.dto.request;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record PredictionRequest(
        @NotNull UUID matchId,
        @Min(0) @Max(30) short homeScore,
        @Min(0) @Max(30) short awayScore
) {}
