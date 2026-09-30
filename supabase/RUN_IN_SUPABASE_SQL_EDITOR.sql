-- ==============================================================================
-- THE GRAVEYARD: MASTER CONSOLIDATED DATABASE SCHEMA & DEMO CLEANUP
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_info text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation_score integer DEFAULT 100;

-- 2. PROJECTS COLUMNS (All V2, V3, and V4 metadata)
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS price_paise integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cover_url text,
    ADD COLUMN IF NOT EXISTS demo_url text,
    ADD COLUMN IF NOT EXISTS license text DEFAULT 'MIT',
    ADD COLUMN IF NOT EXISTS collab_terms text,
    ADD COLUMN IF NOT EXISTS has_archive boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_repo boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS cause_of_death text CHECK (cause_of_death IN (
        'lost_interest', 'no_time', 'pivoted', 'ran_out_of_funding',
        'tech_outdated', 'cofounder_left', 'scope_creep', 'other'
    )) DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS abandoned_on date,
    ADD COLUMN IF NOT EXISTS last_commit_at timestamptz,
    ADD COLUMN IF NOT EXISTS epitaph text,
    ADD COLUMN IF NOT EXISTS revived_at timestamptz,
    ADD COLUMN IF NOT EXISTS tagline text,
    ADD COLUMN IF NOT EXISTS completion_percent smallint CHECK (completion_percent BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS lines_of_code integer,
    ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS todo_items text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS setup_notes text,
    ADD COLUMN IF NOT EXISTS screenshots text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS file_tree jsonb,
    ADD COLUMN IF NOT EXISTS collab_roles jsonb,
    ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS featured_rank smallint,
    ADD COLUMN IF NOT EXISTS seed_key text UNIQUE;

-- Tagline length constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_tagline_check') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_tagline_check CHECK (length(tagline) <= 120);
    END IF;
END $$;

-- 3. PROJECT ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.project_assets (
    project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    file_path text,
    github_repo_id text,
    github_repo_full_name text,
    is_private_repo boolean DEFAULT false,
    file_size_bytes bigint,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. TRANSACTIONS COLUMNS & STATUS
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS invite_status text DEFAULT 'not_applicable';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS invite_error text;

-- 5. COLLAB REQUESTS & NOTIFICATIONS TABLES
CREATE TABLE IF NOT EXISTS public.collab_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pitch text NOT NULL,
    background text,
    contact text NOT NULL DEFAULT '',
    portfolio_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_project_applicant UNIQUE (project_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    link text,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on collab_requests & notifications
ALTER TABLE public.collab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

-- 6. Safe Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Applicants can view their own requests" ON public.collab_requests;
    CREATE POLICY "Applicants can view their own requests"
        ON public.collab_requests FOR SELECT
        TO authenticated
        USING (auth.uid() = applicant_id);

    DROP POLICY IF EXISTS "Owners can view requests on their projects" ON public.collab_requests;
    CREATE POLICY "Owners can view requests on their projects"
        ON public.collab_requests FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = collab_requests.project_id AND p.seller_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Applicants can submit requests" ON public.collab_requests;
    CREATE POLICY "Applicants can submit requests"
        ON public.collab_requests FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = applicant_id);

    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    CREATE POLICY "Users can view their own notifications"
        ON public.notifications FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    CREATE POLICY "Users can update their own notifications"
        ON public.notifications FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Public can view project assets for authorized projects" ON public.project_assets;
    CREATE POLICY "Public can view project assets for authorized projects"
        ON public.project_assets FOR SELECT
        USING (true);
END $$;

-- 7. Safely wipe old ad-hoc test listings ("Test 1", "Test 3", etc.)
DO $$
BEGIN
    IF to_regclass('public.transactions') IS NOT NULL THEN
        DELETE FROM public.transactions WHERE project_id IN (SELECT id FROM public.projects WHERE seed_key IS NULL);
    END IF;
    IF to_regclass('public.collab_requests') IS NOT NULL THEN
        DELETE FROM public.collab_requests WHERE project_id IN (SELECT id FROM public.projects WHERE seed_key IS NULL);
    END IF;
    IF to_regclass('public.project_assets') IS NOT NULL THEN
        DELETE FROM public.project_assets WHERE project_id IN (SELECT id FROM public.projects WHERE seed_key IS NULL);
    END IF;
    DELETE FROM public.projects WHERE seed_key IS NULL;
END $$;

-- 8. Indexes for Featured, Seed, and Telemetry
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects (is_featured, featured_rank) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_projects_seed_key ON public.projects (seed_key) WHERE seed_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_revived_at ON public.projects (revived_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_projects_abandoned_on ON public.projects (abandoned_on DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_projects_cause_of_death ON public.projects (cause_of_death);

-- 9. Column Protection Trigger (Secures is_featured, featured_rank, seed_key, is_sold, etc.)
CREATE OR REPLACE FUNCTION public.check_project_column_protection()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.role() <> 'service_role' THEN
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
        IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
            RAISE EXCEPTION 'is_featured is managed by platform admins only';
        END IF;
        IF NEW.featured_rank IS DISTINCT FROM OLD.featured_rank THEN
            RAISE EXCEPTION 'featured_rank is managed by platform admins only';
        END IF;
        IF NEW.seed_key IS DISTINCT FROM OLD.seed_key THEN
            RAISE EXCEPTION 'seed_key is managed by system seeding only';
        END IF;

        IF OLD.is_sold = TRUE THEN
            IF NEW.has_archive <> OLD.has_archive OR NEW.has_repo <> OLD.has_repo THEN
                RAISE EXCEPTION 'Cannot modify delivery assets of a sold project';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_project_column_protection ON public.projects;
CREATE TRIGGER tr_check_project_column_protection
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.check_project_column_protection();

-- 10. Update get_marketplace_stats() RPC
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

-- 11. Update get_marketplace_feed RPC
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
BEGIN
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
              OR p.tagline ILIKE '%' || p_query || '%'
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

    WITH matching_projects AS (
        SELECT 
            p.id,
            p.seller_id,
            p.title,
            p.tagline,
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
            p.completion_percent,
            p.lines_of_code,
            p.features,
            p.todo_items,
            p.setup_notes,
            p.screenshots,
            p.file_tree,
            p.collab_roles,
            p.is_featured,
            p.featured_rank,
            p.seed_key,
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
              OR p.tagline ILIKE '%' || p_query || '%'
              OR p.epitaph ILIKE '%' || p_query || '%'
          )
          AND (
              p_techs IS NULL 
              OR p_techs = '{}' 
              OR p.tech_stack && p_techs
          )
        ORDER BY
            CASE WHEN p_sort = 'price_asc' THEN p.price_paise END ASC,
            CASE WHEN p_sort = 'price_desc' THEN p.price_paise END DESC,
            CASE WHEN p_sort = 'views' THEN p.views END DESC,
            CASE WHEN p_sort = 'abandoned_recent' THEN p.abandoned_on END DESC NULLS LAST,
            CASE WHEN p_sort = 'newest' THEN p.created_at END DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT json_agg(matching_projects) INTO filtered_rows FROM matching_projects;

    RETURN json_build_object(
        'projects', COALESCE(filtered_rows, '[]'::json),
        'counts', counts
    );
END;
$$;

-- 12. Storage Buckets & Policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-covers',
    'project-covers',
    true,
    2097152, -- 2 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
    'project-files',
    'project-files',
    false,
    52428800 -- 50 MB
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view project covers" ON storage.objects;
    CREATE POLICY "Public can view project covers"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'project-covers');

    DROP POLICY IF EXISTS "Users can upload covers to their folder" ON storage.objects;
    CREATE POLICY "Users can upload covers to their folder"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'project-covers' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );

    DROP POLICY IF EXISTS "Users can update their covers" ON storage.objects;
    CREATE POLICY "Users can update their covers"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'project-covers' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );

    DROP POLICY IF EXISTS "Users can delete their covers" ON storage.objects;
    CREATE POLICY "Users can delete their covers"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'project-covers' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
END $$;

-- 13. Reload PostgREST schema cache
NOTIFY pgrst, 'reload config';
