package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.request.PredictionRequest;
import com.tecnoa.apuestas.api.dto.response.PredictionResponse;
import com.tecnoa.apuestas.domain.service.PredictionService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/groups/{groupId}")
@Tag(name = "Predictions")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/predictions")
    public ResponseEntity<List<PredictionResponse>> getMyPredictions(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(predictionService.getMyPredictions(groupId, principal));
    }

    @PostMapping("/predictions")
    public ResponseEntity<PredictionResponse> submit(
            @PathVariable UUID groupId,
            @Valid @RequestBody PredictionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(predictionService.submitPrediction(groupId, request, principal));
    }

    @GetMapping("/matches/{matchId}/predictions")
    public ResponseEntity<List<PredictionResponse>> getMatchPredictions(
            @PathVariable UUID groupId,
            @PathVariable UUID matchId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(predictionService.getMatchPredictions(groupId, matchId, principal));
    }
}
