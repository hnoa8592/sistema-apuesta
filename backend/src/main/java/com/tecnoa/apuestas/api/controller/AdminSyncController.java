package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.domain.service.ScoringService;
import com.tecnoa.apuestas.infrastructure.footballdata.SyncService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/sync")
@Tag(name = "Admin - Sync")
public class AdminSyncController {

    private final SyncService syncService;
    private final ScoringService scoringService;

    public AdminSyncController(SyncService syncService, ScoringService scoringService) {
        this.syncService = syncService;
        this.scoringService = scoringService;
    }

    @PostMapping("/tournaments")
    public ResponseEntity<Map<String, String>> syncTournaments() {
        syncService.syncCompetitionsAndTeams();
        return ResponseEntity.ok(Map.of("status", "Sync de torneos iniciado"));
    }

    @PostMapping("/fixtures")
    public ResponseEntity<Map<String, String>> syncFixtures() {
        syncService.syncFixtures();
        return ResponseEntity.ok(Map.of("status", "Sync de fixtures iniciado"));
    }

    @PostMapping("/all")
    public ResponseEntity<Map<String, String>> syncAll() {
        syncService.syncCompetitionsAndTeams();
        syncService.syncFixtures();
        return ResponseEntity.ok(Map.of("status", "Sync completo iniciado"));
    }

    @PostMapping("/scoring")
    public ResponseEntity<Map<String, String>> syncScoring() {
        scoringService.calculateAllPendingPoints();
        return ResponseEntity.ok(Map.of("status", "Scoring completado"));
    }
}