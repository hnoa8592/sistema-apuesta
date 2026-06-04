package com.tecnoa.apuestas.domain.model;

import com.tecnoa.apuestas.domain.model.enums.GroupStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "betting_groups")
public class BettingGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(name = "max_participants")
    private Short maxParticipants;

    @Column(name = "is_open", nullable = false)
    private boolean isOpen = true;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "prediction_deadline_minutes", nullable = false)
    private short predictionDeadlineMinutes = 15;

    @Column(name = "wildcards_enabled", nullable = false)
    private boolean wildcardsEnabled = false;

    @Column(name = "entry_fee", precision = 10, scale = 2)
    private BigDecimal entryFee;

    @Column(name = "invite_code", unique = true, nullable = false, length = 16)
    private String inviteCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GroupStatus status = GroupStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }

    // Getters and setters
    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Tournament getTournament() { return tournament; }
    public void setTournament(Tournament tournament) { this.tournament = tournament; }
    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public Short getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Short maxParticipants) { this.maxParticipants = maxParticipants; }
    public boolean isOpen() { return isOpen; }
    public void setOpen(boolean open) { isOpen = open; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public short getPredictionDeadlineMinutes() { return predictionDeadlineMinutes; }
    public void setPredictionDeadlineMinutes(short predictionDeadlineMinutes) { this.predictionDeadlineMinutes = predictionDeadlineMinutes; }
    public boolean isWildcardsEnabled() { return wildcardsEnabled; }
    public void setWildcardsEnabled(boolean wildcardsEnabled) { this.wildcardsEnabled = wildcardsEnabled; }
    public BigDecimal getEntryFee() { return entryFee; }
    public void setEntryFee(BigDecimal entryFee) { this.entryFee = entryFee; }
    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public GroupStatus getStatus() { return status; }
    public void setStatus(GroupStatus status) { this.status = status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
