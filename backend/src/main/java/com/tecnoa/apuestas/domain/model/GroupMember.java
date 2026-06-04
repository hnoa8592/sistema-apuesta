package com.tecnoa.apuestas.domain.model;

import com.tecnoa.apuestas.domain.model.enums.MemberRole;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"}))
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private BettingGroup group;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role = MemberRole.PARTICIPANT;

    @Column(name = "total_points", nullable = false)
    private int totalPoints = 0;

    @Column(name = "exact_predictions", nullable = false)
    private int exactPredictions = 0;

    @Column(name = "correct_results", nullable = false)
    private int correctResults = 0;

    @Column(name = "current_position")
    private Short currentPosition;

    @Column(name = "previous_position")
    private Short previousPosition;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt = OffsetDateTime.now();

    public int getPositionTrend() {
        if (previousPosition == null || currentPosition == null) return 0;
        return previousPosition - currentPosition; // positive = moved up
    }

    // Getters and setters
    public UUID getId() { return id; }
    public BettingGroup getGroup() { return group; }
    public void setGroup(BettingGroup group) { this.group = group; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public MemberRole getRole() { return role; }
    public void setRole(MemberRole role) { this.role = role; }
    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
    public int getExactPredictions() { return exactPredictions; }
    public void setExactPredictions(int exactPredictions) { this.exactPredictions = exactPredictions; }
    public int getCorrectResults() { return correctResults; }
    public void setCorrectResults(int correctResults) { this.correctResults = correctResults; }
    public Short getCurrentPosition() { return currentPosition; }
    public void setCurrentPosition(Short currentPosition) { this.currentPosition = currentPosition; }
    public Short getPreviousPosition() { return previousPosition; }
    public void setPreviousPosition(Short previousPosition) { this.previousPosition = previousPosition; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
}
