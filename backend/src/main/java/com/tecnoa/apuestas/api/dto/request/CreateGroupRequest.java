package com.tecnoa.apuestas.api.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateGroupRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull UUID tournamentId,
        @Min(2) @Max(200) Short maxParticipants,
        boolean isOpen,
        String password,
        @Min(5) @Max(120) short predictionDeadlineMinutes,
        boolean wildcardsEnabled,
        @DecimalMin("0") BigDecimal entryFee
) {
    public CreateGroupRequest {
        if (predictionDeadlineMinutes == 0) predictionDeadlineMinutes = 15;
    }
}
