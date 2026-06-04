CREATE TYPE tournament_type AS ENUM (
    'WORLD_CUP', 'CHAMPIONS_LEAGUE', 'COPA_AMERICA',
    'EUROPA_LEAGUE', 'NATIONAL_LEAGUE', 'OTHER'
);

CREATE TYPE tournament_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'SUSPENDED');

CREATE TABLE tournaments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id  VARCHAR(64) UNIQUE NOT NULL,
    name         VARCHAR(255) NOT NULL,
    short_name   VARCHAR(64),
    type         tournament_type NOT NULL DEFAULT 'OTHER',
    country      VARCHAR(100),
    season       VARCHAR(20),
    start_date   DATE,
    end_date     DATE,
    status       tournament_status NOT NULL DEFAULT 'SCHEDULED',
    has_phases   BOOLEAN NOT NULL DEFAULT FALSE,
    logo_url     TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(64) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    short_name  VARCHAR(10),
    country     VARCHAR(100),
    flag_url    TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TYPE match_stage AS ENUM (
    'GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'
);

CREATE TYPE match_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'POSTPONED', 'CANCELLED');

CREATE TABLE matches (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id           VARCHAR(64) UNIQUE NOT NULL,
    tournament_id         UUID NOT NULL REFERENCES tournaments(id),
    home_team_id          UUID NOT NULL REFERENCES teams(id),
    away_team_id          UUID NOT NULL REFERENCES teams(id),
    scheduled_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    stage                 match_stage NOT NULL DEFAULT 'GROUP',
    group_name            VARCHAR(20),
    match_day             SMALLINT,
    status                match_status NOT NULL DEFAULT 'SCHEDULED',
    home_score            SMALLINT,
    away_score            SMALLINT,
    decided_by_penalties  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_tournament_scheduled ON matches(tournament_id, scheduled_at);
CREATE INDEX idx_matches_status ON matches(status);
