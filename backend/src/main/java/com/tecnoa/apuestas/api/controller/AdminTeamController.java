package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.request.CreateTeamRequest;
import com.tecnoa.apuestas.api.dto.response.TeamResponse;
import com.tecnoa.apuestas.domain.model.Team;
import com.tecnoa.apuestas.domain.repository.TeamRepository;
import com.tecnoa.apuestas.domain.repository.TournamentRepository;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/teams")
@Tag(name = "Admin - Teams")
public class AdminTeamController {

    private final TeamRepository teamRepository;
    private final TournamentRepository tournamentRepository;

    public AdminTeamController(TeamRepository teamRepository, TournamentRepository tournamentRepository) {
        this.teamRepository = teamRepository;
        this.tournamentRepository = tournamentRepository;
    }

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(teamRepository.findAll().stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getById(@PathVariable UUID id,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        Team t = teamRepository.findById(id).orElseThrow(() -> new AppException("Team not found", 404));
        return ResponseEntity.ok(toDto(t));
    }

    @PostMapping
    public ResponseEntity<TeamResponse> create(@Valid @RequestBody CreateTeamRequest req,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        Team t = new Team();
        t.setExternalId("MANUAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        t.setName(req.name());
        t.setShortName(req.shortName());
        t.setCountry(req.country());
        t.setFlagUrl(req.flagUrl());
        if (req.tournamentId() != null) {
            t.setTournament(tournamentRepository.findById(req.tournamentId())
                    .orElseThrow(() -> new AppException("Tournament not found", 404)));
        }
        return ResponseEntity.status(201).body(toDto(teamRepository.save(t)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamResponse> update(@PathVariable UUID id,
                                                @Valid @RequestBody CreateTeamRequest req,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        Team t = teamRepository.findById(id).orElseThrow(() -> new AppException("Team not found", 404));
        t.setName(req.name());
        t.setShortName(req.shortName());
        t.setCountry(req.country());
        t.setFlagUrl(req.flagUrl());
        if (req.tournamentId() != null) {
            t.setTournament(tournamentRepository.findById(req.tournamentId())
                    .orElseThrow(() -> new AppException("Tournament not found", 404)));
        }
        return ResponseEntity.ok(toDto(teamRepository.save(t)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        teamRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private TeamResponse toDto(Team t) {
        return new TeamResponse(t.getId(), t.getExternalId(), t.getName(),
                t.getShortName(), t.getCountry(), t.getFlagUrl());
    }
}