package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.request.CreateTournamentRequest;
import com.tecnoa.apuestas.api.dto.response.TournamentResponse;
import com.tecnoa.apuestas.domain.service.TournamentService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/tournaments")
@Tag(name = "Admin - Tournaments")
public class AdminTournamentController {

    private final TournamentService tournamentService;

    public AdminTournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentResponse> getById(@PathVariable UUID id,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(tournamentService.getTournament(id));
    }

    @PostMapping
    public ResponseEntity<TournamentResponse> create(@Valid @RequestBody CreateTournamentRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.status(201).body(tournamentService.createTournament(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentResponse> update(@PathVariable UUID id,
                                                     @Valid @RequestBody CreateTournamentRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(tournamentService.updateTournament(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        tournamentService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }
}