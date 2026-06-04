package com.tecnoa.apuestas.api.dto.response;

import java.util.UUID;

public record TeamResponse(
        UUID id,
        String externalId,
        String name,
        String shortName,
        String country,
        String flagUrl
) {}