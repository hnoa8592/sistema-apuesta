package com.tecnoa.apuestas.infrastructure.footballdata;

import com.tecnoa.apuestas.config.AppProperties;
import com.tecnoa.apuestas.domain.model.*;
import com.tecnoa.apuestas.domain.model.enums.*;
import com.tecnoa.apuestas.domain.repository.*;
import com.tecnoa.apuestas.domain.service.ScoringService;
import com.tecnoa.apuestas.infrastructure.footballdata.dto.FootballDataDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final FootballDataClient client;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;
    private final ScoringService scoringService;
    private final AppProperties props;

    private static final Map<String, TournamentType> TYPE_MAP = Map.of(
            "WORLD_CUP", TournamentType.WORLD_CUP,
            "CHAMPIONS_LEAGUE", TournamentType.CHAMPIONS_LEAGUE,
            "COPA_AMERICA", TournamentType.COPA_AMERICA,
            "EUROPA_LEAGUE", TournamentType.EUROPA_LEAGUE,
            "NATIONAL_LEAGUE", TournamentType.NATIONAL_LEAGUE
    );

    public SyncService(FootballDataClient client, TournamentRepository tournamentRepository,
                       TeamRepository teamRepository, MatchRepository matchRepository,
                       ScoringService scoringService, AppProperties props) {
        this.client = client;
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.matchRepository = matchRepository;
        this.scoringService = scoringService;
        this.props = props;
    }

    @Transactional
    public void syncCompetitionsAndTeams() {
        log.info("Syncing competitions and teams from Football-Data.org");
        List<AppProperties.FootballDataProperties.CompetitionConfig> supported = props.footballData().supportedCompetitions();

        for (AppProperties.FootballDataProperties.CompetitionConfig config : supported) {
            try {
                // First, save the tournament if it doesn't exist
                Tournament tournament = tournamentRepository.findByExternalId(config.code()).orElseGet(() -> {
                    Tournament newT = new Tournament();
                    newT.setExternalId(config.code());
                    newT.setName(getCompetitionName(config.code()));
                    newT.setShortName(config.code());
                    newT.setType(mapType(config.type()));
                    newT.setStatus(TournamentStatus.SCHEDULED);
                    newT.setHasPhases(config.hasPhases());
                    return tournamentRepository.save(newT);
                });

                syncTeamsForCompetition(config);
                Thread.sleep(200); // respect rate limit (10 req/min)
            } catch (Exception e) {
                log.error("Error syncing competition {}: {}", config.code(), e.getMessage());
            }
        }
    }

    @Transactional
    public void syncFixtures() {
        log.info("Syncing fixtures from Football-Data.org");
        List<Tournament> active = tournamentRepository.findActiveTournaments(1000, 0);

        for (Tournament tournament : active) {
            try {
                syncMatchesForTournament(tournament);
                Thread.sleep(200);
            } catch (Exception e) {
                log.error("Error syncing fixtures for {}: {}", tournament.getName(), e.getMessage());
            }
        }
    }

    @Transactional
    public void syncLiveResults() {
        OffsetDateTime threshold = OffsetDateTime.now().plusMinutes(30);
        List<Match> liveOrSoon = matchRepository.findLiveOrStartingSoon(threshold, "IN_PROGRESS", "SCHEDULED");

        if (liveOrSoon.isEmpty()) return;

        log.debug("Syncing {} live/soon matches", liveOrSoon.size());
        for (Match match : liveOrSoon) {
            try {
                client.fetchMatch(match.getExternalId())
                        .doOnNext(dto -> updateMatch(match, dto))
                        .block();
                Thread.sleep(100);
            } catch (Exception e) {
                log.error("Error syncing match {}: {}", match.getExternalId(), e.getMessage());
            }
        }
    }

    private void syncTeamsForCompetition(AppProperties.FootballDataProperties.CompetitionConfig config) {
        FootballDataDto.TeamsResponse resp = client.fetchTeams(config.code()).block();
        if (resp == null || resp.teams() == null) return;

        for (FootballDataDto.Team dto : resp.teams()) {
            Team team = teamRepository.findByExternalId(String.valueOf(dto.id())).orElseGet(Team::new);
            team.setExternalId(String.valueOf(dto.id()));
            team.setName(dto.name());
            team.setShortName(dto.tla());
            team.setCountry(dto.area() != null ? dto.area().name() : null);
            team.setFlagUrl(dto.crest());
            teamRepository.save(team);
        }
    }

    private void syncMatchesForTournament(Tournament tournament) {
        FootballDataDto.MatchesResponse resp = client.fetchMatches(tournament.getExternalId()).block();
        if (resp == null || resp.matches() == null) return;

        for (FootballDataDto.Match dto : resp.matches()) {
            Optional<Match> existing = matchRepository.findByExternalId(String.valueOf(dto.id()));
            Match match = existing.orElseGet(Match::new);
            match.setExternalId(String.valueOf(dto.id()));
            match.setTournament(tournament);
            match.setScheduledAt(OffsetDateTime.parse(dto.utcDate()));
            match.setStage(mapStage(dto.stage()));
            match.setGroupName(dto.group());
            if (dto.matchday() != null) match.setMatchDay(dto.matchday().shortValue());

            Team home = teamRepository.findByExternalId(String.valueOf(dto.homeTeam().id())).orElse(null);
            Team away = teamRepository.findByExternalId(String.valueOf(dto.awayTeam().id())).orElse(null);
            if (home != null) match.setHomeTeam(home);
            if (away != null) match.setAwayTeam(away);

            MatchStatus prevStatus = match.getStatus();
            updateMatchScore(match, dto);

            match = matchRepository.save(match);

            if (prevStatus != MatchStatus.FINISHED && match.getStatus() == MatchStatus.FINISHED) {
                scoringService.calculatePoints(match.getId());
            }
        }
    }

    private void updateMatch(Match match, FootballDataDto.Match dto) {
        MatchStatus prevStatus = match.getStatus();
        updateMatchScore(match, dto);
        match = matchRepository.save(match);

        if (prevStatus != MatchStatus.FINISHED && match.getStatus() == MatchStatus.FINISHED) {
            scoringService.calculatePoints(match.getId());
        }
    }

    private void updateMatchScore(Match match, FootballDataDto.Match dto) {
        match.setStatus(mapStatus(dto.status()));
        if (dto.score() != null && dto.score().fullTime() != null) {
            FootballDataDto.ScoreDetail ft = dto.score().fullTime();
            if (ft.home() != null) match.setHomeScore(ft.home().shortValue());
            if (ft.away() != null) match.setAwayScore(ft.away().shortValue());
            match.setDecidedByPenalties("PENALTY_SHOOTOUT".equals(dto.score().duration()));
        }
    }

    private TournamentType mapType(String type) {
        if (type == null) return TournamentType.OTHER;
        return switch (type) {
            case "WORLD_CUP" -> TournamentType.WORLD_CUP;
            case "CHAMPIONS_LEAGUE" -> TournamentType.CHAMPIONS_LEAGUE;
            case "COPA_AMERICA" -> TournamentType.COPA_AMERICA;
            case "EUROPA_LEAGUE" -> TournamentType.EUROPA_LEAGUE;
            case "NATIONAL_LEAGUE" -> TournamentType.NATIONAL_LEAGUE;
            default -> TournamentType.OTHER;
        };
    }

    private String getCompetitionName(String code) {
        return switch (code) {
            case "WC" -> "FIFA World Cup";
            case "CL" -> "UEFA Champions League";
            case "CA" -> "Copa America";
            case "EL" -> "UEFA Europa League";
            case "PL" -> "Premier League";
            case "PD" -> "La Liga";
            case "BSA" -> "Brasileirao";
            case "FL1" -> "Ligue 1";
            case "BL1" -> "Bundesliga";
            case "SA" -> "Serie A";
            default -> code;
        };
    }

    private MatchStage mapStage(String stage) {
        if (stage == null) return MatchStage.GROUP;
        return switch (stage) {
            case "ROUND_OF_16" -> MatchStage.ROUND_OF_16;
            case "QUARTER_FINALS" -> MatchStage.QUARTER_FINAL;
            case "SEMI_FINALS" -> MatchStage.SEMI_FINAL;
            case "THIRD_PLACE" -> MatchStage.THIRD_PLACE;
            case "FINAL" -> MatchStage.FINAL;
            default -> MatchStage.GROUP;
        };
    }

    private MatchStatus mapStatus(String status) {
        if (status == null) return MatchStatus.SCHEDULED;
        return switch (status) {
            case "IN_PLAY", "PAUSED", "HALFTIME" -> MatchStatus.IN_PROGRESS;
            case "FINISHED", "AWARDED" -> MatchStatus.FINISHED;
            case "POSTPONED" -> MatchStatus.POSTPONED;
            case "CANCELLED", "SUSPENDED" -> MatchStatus.CANCELLED;
            default -> MatchStatus.SCHEDULED;
        };
    }
}
