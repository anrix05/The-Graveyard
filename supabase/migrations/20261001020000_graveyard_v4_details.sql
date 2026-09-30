-- ==============================================================================
-- THE GRAVEYARD V4: FULL PROJECT DETAILS, CURATED FEATURED & METADATA
-- Migration: 20261001020000_graveyard_v4_details.sql
-- Idempotent, additive schema updates for rich project profiles and demo seeding
-- ==============================================================================

-- A1. Add Detail Columns to public.projects
ALTER TABLE public.projects
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

-- Add constraint for tagline length if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'projects_tagline_check'
    ) THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_tagline_check CHECK (length(tagline) <= 120);
    END IF;
END $$;

-- A2. Indexes for Featured queries and Seed lookup
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects (is_featured, featured_rank) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_projects_seed_key ON public.projects (seed_key) WHERE seed_key IS NOT NULL;

-- A3. Update Column Protection Trigger
-- Protect is_featured, featured_rank, and seed_key so ONLY service_role can modify them.
-- Sellers retain edit permissions on tagline, completion_percent, lines_of_code, features, todo_items, setup_notes, screenshots, file_tree, collab_roles.
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

        -- Service-role only protection for curation and demo seeding
        IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
            RAISE EXCEPTION 'is_featured is managed by platform admins only';
        END IF;
        IF NEW.featured_rank IS DISTINCT FROM OLD.featured_rank THEN
            RAISE EXCEPTION 'featured_rank is managed by platform admins only';
        END IF;
        IF NEW.seed_key IS DISTINCT FROM OLD.seed_key THEN
            RAISE EXCEPTION 'seed_key is managed by system seeding only';
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

-- Ensure trigger is registered on public.projects
DROP TRIGGER IF EXISTS tr_check_project_column_protection ON public.projects;
CREATE TRIGGER tr_check_project_column_protection
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.check_project_column_protection();

-- A4. Update get_marketplace_feed RPC to return new details
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

    -- Query projects matching mode filter
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

-- A5. Storage Policies for project-covers
-- Allow PNG, JPEG, WebP up to 2MB with path prefix auth.uid()/...
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

-- Storage RLS on project-covers
DO $$
BEGIN
    -- Allow public read of project covers
    DROP POLICY IF EXISTS "Public can view project covers" ON storage.objects;
    CREATE POLICY "Public can view project covers"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'project-covers');

    -- Authenticated users can upload under their own folder
    DROP POLICY IF EXISTS "Users can upload covers to their folder" ON storage.objects;
    CREATE POLICY "Users can upload covers to their folder"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'project-covers' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );

    -- Users can update/delete their own covers
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
