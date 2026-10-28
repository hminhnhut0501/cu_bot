-- ==============================================================================
-- Migration: 20261028_optimize_free_tier_retention.sql
-- Purpose: Optimize Supabase Free Tier (500 MB storage cap & 2 GB egress cap)
-- 1. Adds performance & pruning indexes for append-only log tables.
-- 2. Creates an automated retention procedure `prune_free_tier_bloat()` to clean
--    up historical logs/activity older than 60 days.
-- 3. Provides optional pg_cron scheduling instructions for automatic weekly cleanup.
-- ==============================================================================

-- 1. Index optimization for fast pruning and bounded queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_member_activity_date ON analytics_member_activity (activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_member_activity_composite ON analytics_member_activity (bot_key, chat_id, activity_date);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_post_events') THEN
        CREATE INDEX IF NOT EXISTS idx_channel_post_events_created_at ON channel_post_events (created_at DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entertainment_events') THEN
        CREATE INDEX IF NOT EXISTS idx_entertainment_events_created_at ON entertainment_events (created_at DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reputation_events') THEN
        CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON reputation_events (created_at DESC);
    END IF;
END $$;

-- 2. Maintenance Procedure: Prune historical bloat
CREATE OR REPLACE FUNCTION prune_free_tier_bloat(retention_days INT DEFAULT 60)
RETURNS TABLE(
    table_name TEXT,
    deleted_rows BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
    cutoff_timestamptz TIMESTAMPTZ;
    cutoff_date DATE;
    v_deleted BIGINT;
BEGIN
    cutoff_timestamptz := NOW() - (retention_days || ' days')::INTERVAL;
    cutoff_date := CURRENT_DATE - retention_days;

    -- A. Prune audit_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        DELETE FROM audit_logs WHERE created_at < cutoff_timestamptz;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        table_name := 'audit_logs';
        deleted_rows := v_deleted;
        RETURN NEXT;
    END IF;

    -- B. Prune analytics_member_activity (raw daily heartbeats)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_member_activity') THEN
        DELETE FROM analytics_member_activity WHERE activity_date < cutoff_date;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        table_name := 'analytics_member_activity';
        deleted_rows := v_deleted;
        RETURN NEXT;
    END IF;

    -- C. Prune channel_post_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channel_post_events') THEN
        DELETE FROM channel_post_events WHERE created_at < cutoff_timestamptz;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        table_name := 'channel_post_events';
        deleted_rows := v_deleted;
        RETURN NEXT;
    END IF;

    -- D. Prune entertainment_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entertainment_events') THEN
        DELETE FROM entertainment_events WHERE created_at < cutoff_timestamptz;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        table_name := 'entertainment_events';
        deleted_rows := v_deleted;
        RETURN NEXT;
    END IF;

    -- E. Prune reputation_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reputation_events') THEN
        DELETE FROM reputation_events WHERE created_at < cutoff_timestamptz;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        table_name := 'reputation_events';
        deleted_rows := v_deleted;
        RETURN NEXT;
    END IF;

END;
$$;

-- ==============================================================================
-- HOW TO USE:
-- 1. Run manually whenever needed in Supabase SQL Editor:
--      SELECT * FROM prune_free_tier_bloat(60); -- Keeps last 60 days
--
-- 2. (Optional) Run automatically with pg_cron (Supabase Dashboard -> Database -> Extensions -> Enable pg_cron):
--      SELECT cron.schedule(
--          'weekly-free-tier-cleanup',
--          '0 3 * * 0', -- Every Sunday at 03:00 UTC
--          $$SELECT * FROM prune_free_tier_bloat(60);$$
--      );
-- ==============================================================================
