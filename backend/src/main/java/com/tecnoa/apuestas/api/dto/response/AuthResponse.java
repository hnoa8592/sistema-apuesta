package com.tecnoa.apuestas.api.dto.response;

import java.util.UUID;

public record AuthResponse(String accessToken, UserResponse user) {
    public record UserResponse(
            UUID id, String name, String email, String pictureUrl,
            boolean emailVerified, boolean isProfileComplete
    ) {}
}
