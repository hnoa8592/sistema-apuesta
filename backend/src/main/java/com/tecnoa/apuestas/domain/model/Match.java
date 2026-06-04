package com.tecnoa.apuestas.domain.model;

import com.tecnoa.apuestas.domain.model.enums.MatchStage;
import com.tecnoa.apuestas.domain.model.enums.MatchStatus;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_id", unique = true, nullable = false, length = 64)
    private String externalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "home_team_id", nullable = false)
    private Team homeTeam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "away_team_id", nullable = false)
    private Team awayTeam;

    @Column(name = "scheduled_at", nullable = false)
    private OffsetDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStage stage = MatchStage.GROUP;

    @Column(name = "group_name", length = 20)
    private String groupName;

    @Column(name = "match_day")
    private Short matchDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.SCHEDULED;

    @Column(name = "home_score")
    private Short homeScore;

    @Column(name = "away_score")
    private Short awayScore;

    @Column(name = "decided_by_penalties", nullable = false)
    private boolean decidedByPenalties = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }

    public OffsetDateTime getDeadlineAt(int deadlineMinutes) {
        return scheduledAt.minusMinutes(deadlineMinutes);
    }

    // Getters and setters
    public UUID getId() { return id; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public Tournament getTournament() { return tournament; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public Team getHomeTeam() { return homeTeam; }
    public void setHomeTeam(Team homeTeam) { this.homeTeam = homeTeam; }
    public Team getAwayTeam() { return awayTeam; }
    public void setAwayTeam(Team awayTeam) { this.awayTeam = awayTeam; }
    public OffsetDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(OffsetDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public MatchStage getStage() { return stage; }
    public void setStage(MatchStage stage) { this.stage = stage; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public Short getMatchDay() { return matchDay; }
    public void setMatchDay(Short matchDay) { this.matchDay = matchDay; }
    public MatchStatus getStatus() { return status; }
    public void setStatus(MatchStatus status) { this.status = status; }
    public Short getHomeScore() { return homeScore; }
    public void setHomeScore(Short homeScore) { this.homeScore = homeScore; }
    public Short getAwayScore() { return awayScore; }
    public void setAwayScore(Short awayScore) { this.awayScore = awayScore; }
    public boolean isDecidedByPenalties() { return decidedByPenalties; }
    public void setDecidedByPenalties(boolean decidedByPenalties) { this.decidedByPenalties = decidedByPenalties; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
