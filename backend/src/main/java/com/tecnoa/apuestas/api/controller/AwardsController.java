package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.response.AwardsResponse;
import com.tecnoa.apuestas.domain.service.AwardsService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/groups/{groupId}/awards")
@Tag(name = "Awards")
public class AwardsController {

    private final AwardsService awardsService;

    public AwardsController(AwardsService awardsService) {
        this.awardsService = awardsService;
    }

    @GetMapping
    public ResponseEntity<AwardsResponse> getAwards(@PathVariable UUID groupId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(awardsService.getAwards(groupId, principal));
    }
}
