package com.tecnoa.apuestas.api.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AwardsResponse(
        UUID groupId, boolean tournamentFinished,
        BigDecimal totalPool, List<PrizeEntry> prizes,
        CommissionEntry organizerCommission
) {
    public record PrizeEntry(int position, UUID userId, String name, int points,
                             int percentage, BigDecimal amount) {}
    public record CommissionEntry(int percentage, BigDecimal amount) {}
}
