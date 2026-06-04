package com.tecnoa.apuestas.api.dto.request;

import jakarta.validation.constraints.Email;

public record UpdateUserRequest(
        String phone,
        @Email String contactEmail
) {}
