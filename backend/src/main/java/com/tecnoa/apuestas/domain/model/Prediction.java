package com.tecnoa.apuestas.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "predictions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "match_id", "user_id"}))
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private BettingGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "home_score_pred", nullable = false)
    private short homeScorePred;

    @Column(name = "away_score_pred", nullable = false)
    private short awayScorePred;

    @Column(name = "points_earned")
    private Short pointsEarned;

    @Column(name = "submitted_at", nullable = false)
    private OffsetDateTime submittedAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }

    // Getters and setters
    public UUID getId() { return id; }
    public BettingGroup getGroup() { return group; }
    public void setGroup(BettingGroup group) { this.group = group; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public short getHomeScorePred() { return homeScorePred; }
    public void setHomeScorePred(short homeScorePred) { this.homeScorePred = homeScorePred; }
    public short getAwayScorePred() { return awayScorePred; }
    public void setAwayScorePred(short awayScorePred) { this.awayScorePred = awayScorePred; }
    public Short getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Short pointsEarned) { this.pointsEarned = pointsEarned; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
