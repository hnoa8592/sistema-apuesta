package com.tecnoa.apuestas.domain.model;

import com.tecnoa.apuestas.domain.model.enums.WildcardType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "wildcards",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id", "type"}))
public class Wildcard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private BettingGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WildcardType type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "player_name", length = 100)
    private String playerName;

    @Column(name = "points_earned")
    private Short pointsEarned;

    @Column(name = "submitted_at", nullable = false)
    private OffsetDateTime submittedAt = OffsetDateTime.now();

    // Getters and setters
    public UUID getId() { return id; }
    public BettingGroup getGroup() { return group; }
    public void setGroup(BettingGroup group) { this.group = group; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public WildcardType getType() { return type; }
    public void setType(WildcardType type) { this.type = type; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }
    public Short getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Short pointsEarned) { this.pointsEarned = pointsEarned; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
}
