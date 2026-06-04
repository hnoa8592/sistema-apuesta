package com.tecnoa.apuestas.api.dto.response;

import com.tecnoa.apuestas.domain.model.enums.GroupStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record GroupResponse(
        UUID id, String name, TournamentResponse tournament,
        OrganizerSummary organizer,
        Short maxParticipants, boolean isOpen, boolean wildcardsEnabled,
        short predictionDeadlineMinutes, BigDecimal entryFee,
        String inviteCode, String inviteUrl,
        GroupStatus status, int totalParticipants,
        OffsetDateTime createdAt
) {
    public record OrganizerSummary(UUID id, String name, String pictureUrl) {}
}
