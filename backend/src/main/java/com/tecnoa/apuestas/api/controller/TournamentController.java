package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.response.MatchResponse;
import com.tecnoa.apuestas.api.dto.response.PageResponse;
import com.tecnoa.apuestas.api.dto.response.TeamResponse;
import com.tecnoa.apuestas.api.dto.response.TournamentResponse;
import com.tecnoa.apuestas.domain.service.TournamentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tournaments")
@Tag(name = "Tournaments")
public class TournamentController {

    private final TournamentService tournamentService;

    public TournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<TournamentResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tournamentService.listActive(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getById(id));
    }

    @GetMapping("/{id}/matches")
    public ResponseEntity<List<MatchResponse>> getMatches(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getMatches(id));
    }

    @GetMapping("/{id}/teams")
    public ResponseEntity<List<TeamResponse>> getTeams(@PathVariable UUID id) {
        return ResponseEntity.ok(tournamentService.getTeams(id));
    }
}