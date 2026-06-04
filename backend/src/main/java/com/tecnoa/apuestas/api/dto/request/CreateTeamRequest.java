package com.tecnoa.apuestas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateTeamRequest(
        @NotBlank(message = "Name is required") String name,
        String shortName,
        String country,
        String flagUrl,
        UUID tournamentId
) {}