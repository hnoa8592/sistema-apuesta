package com.tecnoa.apuestas.api.dto.request;

import com.tecnoa.apuestas.domain.model.enums.WildcardType;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record WildcardsRequest(List<WildcardEntry> wildcards) {
    public record WildcardEntry(
            @NotNull WildcardType type,
            UUID teamId,
            String playerName
    ) {}
}
