CREATE TABLE predictions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES betting_groups(id) ON DELETE CASCADE,
    match_id        UUID NOT NULL REFERENCES matches(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    home_score_pred SMALLINT NOT NULL,
    away_score_pred SMALLINT NOT NULL,
    points_earned   SMALLINT,
    submitted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, match_id, user_id)
);

CREATE INDEX idx_predictions_group_match ON predictions(group_id, match_id);
CREATE INDEX idx_predictions_user_group  ON predictions(user_id, group_id);
CREATE INDEX idx_predictions_match       ON predictions(match_id);
