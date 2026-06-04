package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/debug")
@Tag(name = "Debug")
public class DebugController {

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return Map.of("authenticated", false);
        }
        return Map.of(
                "authenticated", true,
                "userId", principal.getUserId().toString(),
                "email", principal.getUsername(),
                "role", principal.getRole().name(),
                "isAdmin", principal.isAdmin(),
                "authorities", principal.getAuthorities().stream().map(Object::toString).toList()
        );
    }
}