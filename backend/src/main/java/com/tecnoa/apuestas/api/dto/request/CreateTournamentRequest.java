package com.tecnoa.apuestas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.math.BigDecimal;

public record CreateTournamentRequest(
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "Short name is required") String shortName,
        @NotBlank(message = "Type is required") String type,
        LocalDate startDate,
        LocalDate endDate,
        String season,
        boolean hasPhases,
        String logoUrl
) {}