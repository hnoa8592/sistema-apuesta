package com.tecnoa.apuestas.api.dto.response;

import com.tecnoa.apuestas.domain.model.enums.WildcardType;
import java.util.UUID;

public record WildcardResponse(
        UUID id, WildcardType type, String label,
        UUID teamId, String teamName, String playerName,
        int potentialPoints, Short pointsEarned, boolean isLocked
) {}
