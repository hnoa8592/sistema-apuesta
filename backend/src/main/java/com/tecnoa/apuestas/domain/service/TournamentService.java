package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.api.dto.request.CreateTournamentRequest;
import com.tecnoa.apuestas.api.dto.response.MatchResponse;
import com.tecnoa.apuestas.api.dto.response.PageResponse;
import com.tecnoa.apuestas.api.dto.response.TeamResponse;
import com.tecnoa.apuestas.api.dto.response.TournamentResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.api.exception.ErrorCode;
import com.tecnoa.apuestas.domain.model.Match;
import com.tecnoa.apuestas.domain.model.Team;
import com.tecnoa.apuestas.domain.model.Tournament;
import com.tecnoa.apuestas.domain.model.enums.TournamentStatus;
import com.tecnoa.apuestas.domain.model.enums.TournamentType;
import com.tecnoa.apuestas.domain.repository.MatchRepository;
import com.tecnoa.apuestas.domain.repository.TeamRepository;
import com.tecnoa.apuestas.domain.repository.TournamentRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;

    public TournamentService(TournamentRepository tournamentRepository, MatchRepository matchRepository, TeamRepository teamRepository) {
        this.tournamentRepository = tournamentRepository;
        this.matchRepository = matchRepository;
        this.teamRepository = teamRepository;
    }

    @Cacheable("tournaments")
    public PageResponse<TournamentResponse> listActive(Pageable pageable) {
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        List<Tournament> tournaments = tournamentRepository.findActiveTournaments(size, page * size);
        long total = tournamentRepository.countActiveTournaments();
        org.springframework.data.domain.Page<Tournament> pageResult = new org.springframework.data.domain.PageImpl<>(
                tournaments, pageable, total);
        return PageResponse.from(pageResult, this::toDto);
    }

    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAll().stream().map(this::toDto).toList();
    }

    public TournamentResponse getTournament(UUID id) {
        return toDto(findOrThrow(id));
    }

    public TournamentResponse createTournament(CreateTournamentRequest req) {
        Tournament t = new Tournament();
        t.setName(req.name());
        t.setShortName(req.shortName());
        t.setType(TournamentType.valueOf(req.type()));
        t.setStatus(TournamentStatus.SCHEDULED);
        t.setStartDate(req.startDate());
        t.setEndDate(req.endDate());
        t.setSeason(req.season());
        t.setHasPhases(req.hasPhases());
        t.setLogoUrl(req.logoUrl());
        return toDto(tournamentRepository.save(t));
    }

    public TournamentResponse updateTournament(UUID id, CreateTournamentRequest req) {
        Tournament t = findOrThrow(id);
        t.setName(req.name());
        t.setShortName(req.shortName());
        t.setType(TournamentType.valueOf(req.type()));
        t.setStartDate(req.startDate());
        t.setEndDate(req.endDate());
        t.setSeason(req.season());
        t.setHasPhases(req.hasPhases());
        t.setLogoUrl(req.logoUrl());
        return toDto(tournamentRepository.save(t));
    }

    public void deleteTournament(UUID id) {
        Tournament t = findOrThrow(id);
        tournamentRepository.delete(t);
    }

    public TournamentResponse getById(UUID id) {
        return toDto(findOrThrow(id));
    }

    public List<MatchResponse> getMatches(UUID tournamentId) {
        findOrThrow(tournamentId);
        return matchRepository.findByTournamentIdOrderByScheduledAt(tournamentId)
                .stream().map(this::toMatchDto).toList();
    }

    public List<TeamResponse> getTeams(UUID tournamentId) {
        List<Team> teams = teamRepository.findByTournamentId(tournamentId);
        return teams.stream().map(this::toTeamDto).toList();
    }

    private TeamResponse toTeamDto(Team t) {
        return new TeamResponse(t.getId(), t.getExternalId(), t.getName(),
                t.getShortName(), t.getCountry(), t.getFlagUrl());
    }

    private Tournament findOrThrow(UUID id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TOURNAMENT_NOT_FOUND, "Tournament not found"));
    }

    public TournamentResponse toDto(Tournament t) {
        return new TournamentResponse(t.getId(), t.getName(), t.getShortName(),
                t.getType(), t.getStatus(), t.getStartDate(), t.getEndDate(),
                t.getSeason(), t.isHasPhases(), t.getLogoUrl());
    }

    public MatchResponse toMatchDto(Match m) {
        return new MatchResponse(
                m.getId(),
                new MatchResponse.TeamSummary(m.getHomeTeam().getId(), m.getHomeTeam().getName(),
                        m.getHomeTeam().getShortName(), m.getHomeTeam().getFlagUrl()),
                new MatchResponse.TeamSummary(m.getAwayTeam().getId(), m.getAwayTeam().getName(),
                        m.getAwayTeam().getShortName(), m.getAwayTeam().getFlagUrl()),
                m.getScheduledAt(), m.getStage(), m.getGroupName(), m.getMatchDay(),
                m.getStatus(), m.getHomeScore(), m.getAwayScore(), m.isDecidedByPenalties(),
                m.getStage().correctResult, m.getStage().exactScore
        );
    }
}
