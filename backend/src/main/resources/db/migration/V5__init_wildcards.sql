CREATE TYPE wildcard_type AS ENUM (
    'FINALIST_1', 'FINALIST_2', 'BEST_PLAYER', 'BEST_GOALKEEPER', 'TOP_SCORER'
);

CREATE TABLE wildcards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id      UUID NOT NULL REFERENCES betting_groups(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id),
    type          wildcard_type NOT NULL,
    team_id       UUID REFERENCES teams(id),
    player_name   VARCHAR(100),
    points_earned SMALLINT,
    submitted_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id, type)
);
