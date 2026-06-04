package com.tecnoa.apuestas.infrastructure.footballdata;

import com.tecnoa.apuestas.config.AppProperties;
import com.tecnoa.apuestas.infrastructure.footballdata.dto.FootballDataDto;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class FootballDataClient {

    private final AppProperties props;
    private final WebClient.Builder webClientBuilder;
    private WebClient client;

    public FootballDataClient(AppProperties props, WebClient.Builder webClientBuilder) {
        this.props = props;
        this.webClientBuilder = webClientBuilder;
    }

    @PostConstruct
    public void init() {
        client = webClientBuilder
                .baseUrl(props.footballData().baseUrl())
                .defaultHeader("X-Auth-Token", props.footballData().apiKey())
                .build();
    }

    public Mono<FootballDataDto.CompetitionResponse> fetchCompetitions() {
        return client.get()
                .uri("/competitions?plan=TIER_ONE")
                .retrieve()
                .bodyToMono(FootballDataDto.CompetitionResponse.class)
                .timeout(Duration.ofSeconds(10));
    }

    public Mono<FootballDataDto.TeamsResponse> fetchTeams(String competitionCode) {
        return client.get()
                .uri("/competitions/{code}/teams", competitionCode)
                .retrieve()
                .bodyToMono(FootballDataDto.TeamsResponse.class)
                .timeout(Duration.ofSeconds(10));
    }

    public Mono<FootballDataDto.MatchesResponse> fetchMatches(String competitionCode) {
        return client.get()
                .uri("/competitions/{code}/matches", competitionCode)
                .retrieve()
                .bodyToMono(FootballDataDto.MatchesResponse.class)
                .timeout(Duration.ofSeconds(10));
    }

    public Mono<FootballDataDto.Match> fetchMatch(String matchId) {
        return client.get()
                .uri("/matches/{id}", matchId)
                .retrieve()
                .bodyToMono(FootballDataDto.Match.class)
                .timeout(Duration.ofSeconds(10));
    }
}
