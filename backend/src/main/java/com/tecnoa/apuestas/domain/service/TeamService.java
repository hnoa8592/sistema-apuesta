package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.api.dto.response.TeamResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.api.exception.ErrorCode;
import com.tecnoa.apuestas.domain.model.Team;
import com.tecnoa.apuestas.domain.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream().map(this::toDto).toList();
    }

    public TeamResponse getTeam(java.util.UUID id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEAM_NOT_FOUND, "Team not found"));
        return toDto(team);
    }

    private TeamResponse toDto(Team t) {
        return new TeamResponse(t.getId(), t.getExternalId(), t.getName(),
                t.getShortName(), t.getCountry(), t.getFlagUrl());
    }
}