-- ==============================================================================
-- THE GRAVEYARD V3: TOMBSTONES, REVIVAL TRACKING & FEED RPC
-- Migration: 20261001010000_graveyard_v3_tombstones.sql
-- Idempotent script for tombstone metadata, revived status, and feed aggregation
-- ==============================================================================

-- A1. Add Tombstone & Revival Columns to projects
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS cause_of_death text CHECK (cause_of_death IN (
        'lost_interest',
        'no_time',
        'pivoted',
        'ran_out_of_funding',
        'tech_outdated',
        'cofounder_left',
        'scope_creep',
        'other'
    )) DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS abandoned_on date,
    ADD COLUMN IF NOT EXISTS last_commit_at timestamptz,
    ADD COLUMN IF NOT EXISTS epitaph text,
    ADD COLUMN IF NOT EXISTS revived_at timestamptz;

-- Ensure profiles has reputation_score column
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS reputation_score integer DEFAULT 100;

-- A2. Column Protection Trigger Update
-- Block non-service-role changes to last_commit_at and revived_at in addition to v2 protected columns
CREATE OR REPLACE FUNCTION public.check_project_column_protection()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.role() <> 'service_role' THEN
        -- Prevent changing immutable core fields
        IF NEW.seller_id <> OLD.seller_id THEN
            RAISE EXCEPTION 'Cannot modify seller_id';
        END IF;
        IF NEW.is_sold <> OLD.is_sold THEN
            RAISE EXCEPTION 'Cannot modify is_sold directly from client';
        END IF;
        IF NEW.views <> OLD.views THEN
            RAISE EXCEPTION 'Cannot modify views directly (use increment_project_view RPC)';
        END IF;
        IF NEW.interaction_type <> OLD.interaction_type THEN
            RAISE EXCEPTION 'Cannot modify interaction_type once created';
        END IF;
        IF NEW.price_paise <> OLD.price_paise THEN
            RAISE EXCEPTION 'Cannot modify price_paise once created';
        END IF;
        IF NEW.created_at <> OLD.created_at THEN
            RAISE EXCEPTION 'Cannot modify created_at';
        END IF;
        IF NEW.last_commit_at IS DISTINCT FROM OLD.last_commit_at THEN
            RAISE EXCEPTION 'last_commit_at is managed server-side only';
        END IF;
        IF NEW.revived_at IS DISTINCT FROM OLD.revived_at THEN
            RAISE EXCEPTION 'revived_at is managed server-side only';
        END IF;

        -- If sold, freeze delivery references
        IF OLD.is_sold = TRUE THEN
            IF NEW.has_archive <> OLD.has_archive OR NEW.has_repo <> OLD.has_repo THEN
                RAISE EXCEPTION 'Cannot modify delivery assets of a sold project';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- A3. Backfill revived_at for existing sold, adopted, or filled projects
UPDATE public.projects p
SET revived_at = (
    SELECT COALESCE(t.created_at, p.created_at)
    FROM public.transactions t
    WHERE t.project_id = p.id AND t.status = 'completed'
    ORDER BY t.created_at ASC
    LIMIT 1
)
WHERE p.revived_at IS NULL AND (p.is_sold = TRUE OR EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.project_id = p.id AND t.status = 'completed' AND t.kind = 'adopt'
));

-- Backfill filled collab listings
UPDATE public.projects
SET revived_at = created_at
WHERE revived_at IS NULL AND is_collab_filled = TRUE;

-- A4. Update get_marketplace_stats() RPC
-- live_total excludes sold, filled, and archived
-- resurrected counts sold + adopted-at-least-once + collab-filled
CREATE OR REPLACE FUNCTION public.get_marketplace_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'live_total', (
            SELECT count(*) 
            FROM public.projects 
            WHERE is_archived = false 
              AND is_sold = false 
              AND is_collab_filled = false
        ),
        'for_sale', (
            SELECT count(*) 
            FROM public.projects 
            WHERE is_archived = false 
              AND is_sold = false 
              AND interaction_type = 'buy'
        ),
        'free_forks', (
            SELECT count(*) 
            FROM public.projects 
            WHERE is_archived = false 
              AND interaction_type = 'adopt'
        ),
        'open_collabs', (
            SELECT count(*) 
            FROM public.projects 
            WHERE is_archived = false 
              AND is_collab_filled = false 
              AND interaction_type = 'collab'
        ),
        'resurrected', (
            SELECT count(DISTINCT p.id) 
            FROM public.projects p
            WHERE p.is_sold = true 
               OR p.is_collab_filled = true 
               OR EXISTS (
                   SELECT 1 FROM public.transactions t 
                   WHERE t.project_id = p.id 
                     AND t.status = 'completed' 
                     AND t.kind = 'adopt'
               )
        ),
        'operatives', (
            SELECT count(*) 
            FROM public.profiles
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- A5. Index for resurrected wall and tombstone filtering
CREATE INDEX IF NOT EXISTS idx_projects_revived_at ON public.projects (revived_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_projects_abandoned_on ON public.projects (abandoned_on DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_projects_cause_of_death ON public.projects (cause_of_death);

-- A6. Feed Aggregation Function: get_marketplace_feed
-- Returns filtered projects alongside synchronized counts per mode
CREATE OR REPLACE FUNCTION public.get_marketplace_feed(
    p_mode text DEFAULT 'all',
    p_techs text[] DEFAULT NULL,
    p_query text DEFAULT NULL,
    p_sort text DEFAULT 'newest',
    p_include_resurrected boolean DEFAULT false,
    p_limit int DEFAULT 30,
    p_offset int DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    filtered_rows json;
    counts json;
    total_matching bigint;
BEGIN
    -- Mode-specific counts reflecting current search & tech filters
    WITH base_filter AS (
        SELECT p.*
        FROM public.projects p
        WHERE p.is_archived = false
          AND (
              p_include_resurrected = true 
              OR (p.is_sold = false AND p.is_collab_filled = false)
          )
          AND (
              p_query IS NULL 
              OR p.title ILIKE '%' || p_query || '%'
              OR p.description ILIKE '%' || p_query || '%'
              OR p.epitaph ILIKE '%' || p_query || '%'
          )
          AND (
              p_techs IS NULL 
              OR p_techs = '{}' 
              OR p.tech_stack && p_techs
          )
    )
    SELECT json_build_object(
        'all', (SELECT count(*) FROM base_filter),
        'buy', (SELECT count(*) FROM base_filter WHERE interaction_type = 'buy'),
        'adopt', (SELECT count(*) FROM base_filter WHERE interaction_type = 'adopt'),
        'collab', (SELECT count(*) FROM base_filter WHERE interaction_type = 'collab')
    ) INTO counts;

    -- Query projects matching mode filter
    WITH matching_projects AS (
        SELECT 
            p.id,
            p.seller_id,
            p.title,
            p.description,
            p.tech_stack,
            p.interaction_type,
            p.price_paise,
            p.cover_url,
            p.demo_url,
            p.license,
            p.collab_terms,
            p.cause_of_death,
            p.abandoned_on,
            p.last_commit_at,
            p.epitaph,
            p.revived_at,
            p.has_archive,
            p.has_repo,
            p.is_sold,
            p.is_archived,
            p.is_collab_filled,
            p.views,
            p.created_at,
            json_build_object(
                'id', pr.id,
                'username', pr.username,
                'avatar_url', pr.avatar_url,
                'bio', pr.bio,
                'reputation_score', pr.reputation_score
            ) as seller
        FROM public.projects p
        LEFT JOIN public.profiles pr ON p.seller_id = pr.id
        WHERE p.is_archived = false
          AND (
              p_include_resurrected = true 
              OR (p.is_sold = false AND p.is_collab_filled = false)
          )
          AND (
              p_mode = 'all' 
              OR p.interaction_type = p_mode
          )
          AND (
              p_query IS NULL 
              OR p.title ILIKE '%' || p_query || '%'
              OR p.description ILIKE '%' || p_query || '%'
              OR p.epitaph ILIKE '%' || p_query || '%'
          )
          AND (
              p_techs IS NULL 
              OR p_techs = '{}' 
              OR p.tech_stack && p_techs
          )
        ORDER BY
            CASE WHEN p_sort = 'newest' THEN p.created_at END DESC NULLS LAST,
            CASE WHEN p_sort = 'views' THEN p.views END DESC NULLS LAST,
            CASE WHEN p_sort = 'price_asc' THEN p.price_paise END ASC NULLS LAST,
            CASE WHEN p_sort = 'price_desc' THEN p.price_paise END DESC NULLS LAST,
            CASE WHEN p_sort = 'longest_dead' THEN p.abandoned_on END ASC NULLS LAST,
            p.created_at DESC
        LIMIT p_limit OFFSET p_offset
    )
    SELECT COALESCE(json_agg(row_to_json(matching_projects)), '[]'::json)
    INTO filtered_rows
    FROM matching_projects;

    RETURN json_build_object(
        'projects', filtered_rows,
        'counts', counts
    );
END;
$$;
