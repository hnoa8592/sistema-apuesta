package com.tecnoa.apuestas.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(@NotBlank String idToken) {}
