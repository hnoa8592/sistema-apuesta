package com.tecnoa.apuestas.api.dto.response;

import com.tecnoa.apuestas.domain.model.enums.TournamentStatus;
import com.tecnoa.apuestas.domain.model.enums.TournamentType;
import java.time.LocalDate;
import java.util.UUID;

public record TournamentResponse(
        UUID id, String name, String shortName,
        TournamentType type, TournamentStatus status,
        LocalDate startDate, LocalDate endDate,
        String season, boolean hasPhases, String logoUrl
) {}
