package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.request.WildcardsRequest;
import com.tecnoa.apuestas.api.dto.response.WildcardResponse;
import com.tecnoa.apuestas.domain.service.WildcardService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/groups/{groupId}/wildcards")
@Tag(name = "Wildcards")
public class WildcardController {

    private final WildcardService wildcardService;

    public WildcardController(WildcardService wildcardService) {
        this.wildcardService = wildcardService;
    }

    @GetMapping
    public ResponseEntity<List<WildcardResponse>> getMyWildcards(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(wildcardService.getMyWildcards(groupId, principal));
    }

    @PutMapping
    public ResponseEntity<List<WildcardResponse>> update(
            @PathVariable UUID groupId,
            @Valid @RequestBody WildcardsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(wildcardService.updateWildcards(groupId, request, principal));
    }
}
