package com.tecnoa.apuestas.infrastructure.footballdata.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FootballDataDto {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CompetitionResponse(List<Competition> competitions) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Competition(Long id, String name, String code, String emblem,
                              Area area, CurrentSeason currentSeason) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Area(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CurrentSeason(String startDate, String endDate) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TeamsResponse(List<Team> teams) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Team(Long id, String name, String tla, String crest, Area area) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MatchesResponse(List<Match> matches) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Match(Long id, String utcDate, String status, Integer matchday,
                        String stage, String group,
                        Team homeTeam, Team awayTeam, Score score, Competition competition) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Score(String winner, String duration, ScoreDetail fullTime, ScoreDetail halfTime) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScoreDetail(Integer home, Integer away) {}
}
