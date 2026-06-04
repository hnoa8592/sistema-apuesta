package com.tecnoa.apuestas.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public record JoinGroupRequest(@NotBlank String inviteCode, String password) {}
