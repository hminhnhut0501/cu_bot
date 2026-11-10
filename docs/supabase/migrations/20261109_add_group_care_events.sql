-- Migration: Add Group Care & Idol Voting Module Tables
-- Date: 2026-11-09

-- 1. Table: care_seasons (Mùa giải sự kiện hàng tháng)
CREATE TABLE IF NOT EXISTS public.care_seasons (
    id BIGSERIAL PRIMARY KEY,
    bot_key TEXT NOT NULL DEFAULT 'main',
    chat_id TEXT NOT NULL,
    season_code TEXT NOT NULL, -- e.g. "2026-11"
    title TEXT NOT NULL, -- e.g. "Bình chọn Idol Tháng 11/2026"
    start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'announced', 'archived'
    settings JSONB NOT NULL DEFAULT '{"votes_per_user": 1, "min_member_days": 0, "allow_change_vote": true, "require_approval": false}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_seasons_bot_chat ON public.care_seasons (bot_key, chat_id, status);
CREATE INDEX IF NOT EXISTS idx_care_seasons_code ON public.care_seasons (season_code);

-- 2. Table: care_idols (Danh sách Idol được thành viên đề xuất)
CREATE TABLE IF NOT EXISTS public.care_idols (
    id BIGSERIAL PRIMARY KEY,
    season_id BIGINT NOT NULL REFERENCES public.care_seasons(id) ON DELETE CASCADE,
    bot_key TEXT NOT NULL DEFAULT 'main',
    chat_id TEXT NOT NULL,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    nominated_by_user_id TEXT NOT NULL,
    nominated_by_name TEXT NOT NULL,
    vote_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'approved', -- 'approved', 'pending', 'hidden'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_idols_season ON public.care_idols (season_id, status, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_care_idols_norm_name ON public.care_idols (season_id, normalized_name);

-- 3. Table: care_votes (Phiếu bầu của thành viên)
CREATE TABLE IF NOT EXISTS public.care_votes (
    id BIGSERIAL PRIMARY KEY,
    season_id BIGINT NOT NULL REFERENCES public.care_seasons(id) ON DELETE CASCADE,
    idol_id BIGINT NOT NULL REFERENCES public.care_idols(id) ON DELETE CASCADE,
    bot_key TEXT NOT NULL DEFAULT 'main',
    chat_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    vote_weight INT NOT NULL DEFAULT 1,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_care_votes_season_user ON public.care_votes (season_id, user_id);
CREATE INDEX IF NOT EXISTS idx_care_votes_idol ON public.care_votes (idol_id);
