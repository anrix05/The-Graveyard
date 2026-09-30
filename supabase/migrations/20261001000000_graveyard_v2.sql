-- ============================================================================
-- THE GRAVEYARD V2 CONSOLIDATED DATABASE & SECURITY MIGRATION
-- Migration: 20261001000000_graveyard_v2.sql
-- Description:
--   A1. Double-sale & adopt protection (kind 'buy' vs 'adopt', unique indexes, status enum, soft hold)
--   A2. Integer money (price_paise), CHECK constraints per listing type
--   A3. Delivery asset isolation (project_assets table, RLS, public booleans on projects)
--   A4. New public project columns (cover_url, demo_url, license, collab_terms)
--   A5. Column update protection trigger & secure view count RPC
--   A6. Service-role-only transactions write policy
--   A7. Storage isolation (project-files user prefix, public project-covers bucket)
--   A8. Messages enhancement (project_id, thread_key, immutable content trigger, Realtime)
--   A9. New tables: collab_requests, notifications (with full RLS)
--   A10. Profiles expansion (unique username, avatar_url, bio)
--   A11. Single-source get_marketplace_stats() RPC
-- ============================================================================

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- A10. PROFILES ENHANCEMENTS
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Ensure username has unique constraint if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
    ) THEN
        -- If duplicate usernames exist from legacy auto-generated names, disambiguate before adding constraint
        UPDATE public.profiles p1
        SET username = p1.username || '_' || SUBSTRING(p1.id::text FROM 1 FOR 4)
        WHERE EXISTS (
            SELECT 1 FROM public.profiles p2 
            WHERE p2.username = p1.username AND p2.id <> p1.id
        );

        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END $$;


-- ============================================================================
-- A2 & A4. PROJECTS COLUMNS & CONSTRAINTS
-- ============================================================================
-- Add price_paise if not exists
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS price_paise integer NOT NULL DEFAULT 0;

-- Backfill price_paise from price if legacy price column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'price'
    ) THEN
        UPDATE public.projects 
        SET price_paise = ROUND(COALESCE(price, 0) * 100)::integer
        WHERE price_paise = 0 AND price > 0;
        
        ALTER TABLE public.projects DROP COLUMN price CASCADE;
    END IF;
END $$;

-- Add new public fields to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS demo_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS license text DEFAULT 'MIT';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS collab_terms text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS has_archive boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS has_repo boolean NOT NULL DEFAULT false;

-- Backfill booleans from legacy columns if they exist before dropping in A3
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'file_url'
    ) THEN
        UPDATE public.projects SET has_archive = (file_url IS NOT NULL AND file_url <> '');
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'repo_link'
    ) THEN
        UPDATE public.projects SET has_repo = (repo_link IS NOT NULL AND repo_link <> '');
    END IF;
END $$;

-- Enforce price_paise constraints per interaction_type
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS check_project_price_by_type;
ALTER TABLE public.projects ADD CONSTRAINT check_project_price_by_type CHECK (
    (interaction_type = 'buy' AND price_paise > 0) OR
    (interaction_type = 'adopt' AND price_paise = 0) OR
    (interaction_type = 'collab' AND price_paise = 0)
);


-- ============================================================================
-- A3. DELIVERY DATA ISOLATION (project_assets)
-- ============================================================================
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

-- Backfill project_assets from projects if legacy delivery columns still exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'file_url'
    ) THEN
        INSERT INTO public.project_assets (
            project_id,
            file_path,
            github_repo_id,
            github_repo_full_name,
            is_private_repo
        )
        SELECT 
            id,
            file_url,
            github_repo_id,
            github_repo_full_name,
            COALESCE(is_private_repo, false)
        FROM public.projects
        ON CONFLICT (project_id) DO UPDATE SET
            file_path = EXCLUDED.file_path,
            github_repo_id = EXCLUDED.github_repo_id,
            github_repo_full_name = EXCLUDED.github_repo_full_name,
            is_private_repo = EXCLUDED.is_private_repo;

        -- Drop legacy delivery columns from projects table to prevent leakage
        ALTER TABLE public.projects DROP COLUMN IF EXISTS file_url CASCADE;
        ALTER TABLE public.projects DROP COLUMN IF EXISTS repo_link CASCADE;
        ALTER TABLE public.projects DROP COLUMN IF EXISTS github_repo_id CASCADE;
        ALTER TABLE public.projects DROP COLUMN IF EXISTS github_repo_full_name CASCADE;
        ALTER TABLE public.projects DROP COLUMN IF EXISTS is_private_repo CASCADE;
    END IF;
END $$;


-- ============================================================================
-- A1. TRANSACTIONS ENHANCEMENTS & FIXED INDEXES
-- ============================================================================
-- Drop old unique completed index
DROP INDEX IF EXISTS public.unique_completed_project_purchase;

-- Add transactions columns
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS invite_status text DEFAULT 'not_applicable';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS invite_error text;

-- Backfill kind from projects interaction_type if null
UPDATE public.transactions t
SET kind = CASE 
    WHEN p.interaction_type = 'buy' THEN 'buy'
    ELSE 'adopt'
END
FROM public.projects p
WHERE t.project_id = p.id AND (t.kind IS NULL OR t.kind = '');

-- Set default and check constraints on transactions
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_transaction_kind;
ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_kind CHECK (kind IN ('buy', 'adopt'));

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_transaction_status;
ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_status CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
);

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_transaction_invite_status;
ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_invite_status CHECK (
    invite_status IN ('not_applicable', 'pending', 'sent', 'failed')
);

-- Unique index for razorpay_order_id if present
DROP INDEX IF EXISTS public.unique_razorpay_order_id_idx;
CREATE UNIQUE INDEX unique_razorpay_order_id_idx
ON public.transactions (razorpay_order_id)
WHERE (razorpay_order_id IS NOT NULL);

-- Unique index for buy: only one completed purchase per project
DROP INDEX IF EXISTS public.unique_completed_buy_purchase;
CREATE UNIQUE INDEX unique_completed_buy_purchase
ON public.transactions (project_id)
WHERE (status = 'completed' AND kind = 'buy');

-- Unique index for adopt: one claim per user per project
DROP INDEX IF EXISTS public.unique_completed_adopt_claim;
CREATE UNIQUE INDEX unique_completed_adopt_claim
ON public.transactions (project_id, buyer_id)
WHERE (status = 'completed' AND kind = 'adopt');

-- Unique index on payment_id
DROP INDEX IF EXISTS public.unique_payment_id_idx;
CREATE UNIQUE INDEX unique_payment_id_idx
ON public.transactions (payment_id)
WHERE (payment_id IS NOT NULL);


-- ============================================================================
-- A9. NEW TABLES: COLLAB REQUESTS & NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collab_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pitch text NOT NULL,
    background text,
    contact text NOT NULL,
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


-- ============================================================================
-- A8. MESSAGES ENHANCEMENTS & THREAD KEY
-- ============================================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS thread_key text;

-- Function to compute deterministic thread_key
CREATE OR REPLACE FUNCTION public.compute_thread_key(uid1 uuid, uid2 uuid, pid uuid)
RETURNS text AS $$
BEGIN
    RETURN LEAST(uid1::text, uid2::text) || ':' || GREATEST(uid1::text, uid2::text) || ':' || COALESCE(pid::text, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-populate thread_key if missing
CREATE OR REPLACE FUNCTION public.set_message_thread_key()
RETURNS trigger AS $$
BEGIN
    IF NEW.thread_key IS NULL OR NEW.thread_key = '' THEN
        NEW.thread_key := public.compute_thread_key(NEW.sender_id, NEW.receiver_id, NEW.project_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_message_thread_key ON public.messages;
CREATE TRIGGER trg_set_message_thread_key
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_message_thread_key();

-- Index on thread_key, created_at
CREATE INDEX IF NOT EXISTS idx_messages_thread_key_created ON public.messages(thread_key, created_at ASC);

-- Enforce message content immutability
CREATE OR REPLACE FUNCTION public.check_message_immutable_content()
RETURNS trigger AS $$
BEGIN
    IF NEW.content <> OLD.content OR NEW.sender_id <> OLD.sender_id OR NEW.receiver_id <> OLD.receiver_id OR NEW.project_id IS DISTINCT FROM OLD.project_id THEN
        RAISE EXCEPTION 'Message content, sender, receiver, and project are strictly immutable.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_message_immutable ON public.messages;
CREATE TRIGGER trg_check_message_immutable
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.check_message_immutable_content();


-- ============================================================================
-- A5. PROJECT COLUMN PROTECTION TRIGGER & VIEW COUNT RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.protect_project_columns()
RETURNS trigger AS $$
BEGIN
    -- Allow service role full authority
    IF (current_setting('request.jwt.claim.role', true) = 'service_role' OR auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- Block non-service-role changes to protected columns
    IF NEW.seller_id <> OLD.seller_id THEN
        RAISE EXCEPTION 'Modifying seller_id is prohibited.';
    END IF;
    IF NEW.is_sold <> OLD.is_sold THEN
        RAISE EXCEPTION 'Directly modifying is_sold is prohibited. Use verified settlement routes.';
    END IF;
    IF NEW.views <> OLD.views THEN
        RAISE EXCEPTION 'Directly updating view count is prohibited. Use increment_project_view RPC.';
    END IF;
    IF NEW.interaction_type <> OLD.interaction_type THEN
        RAISE EXCEPTION 'Modifying interaction_type is prohibited once published.';
    END IF;
    IF NEW.price_paise <> OLD.price_paise THEN
        RAISE EXCEPTION 'Modifying price_paise directly is prohibited.';
    END IF;
    IF NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'Modifying created_at is prohibited.';
    END IF;

    -- If already sold, also block delivery and core parameter modifications
    IF OLD.is_sold = true THEN
        IF NEW.has_archive <> OLD.has_archive OR NEW.has_repo <> OLD.has_repo THEN
            RAISE EXCEPTION 'Cannot modify delivery assets for a sold project.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_project_columns ON public.projects;
CREATE TRIGGER trg_protect_project_columns
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.protect_project_columns();

-- Secure View Counter RPC (Ignores views from the project's own seller)
CREATE OR REPLACE FUNCTION public.increment_project_view(p_id uuid)
RETURNS void AS $$
DECLARE
    current_seller uuid;
BEGIN
    SELECT seller_id INTO current_seller FROM public.projects WHERE id = p_id;
    
    -- Only increment if caller is not the seller
    IF current_seller IS NOT NULL AND (auth.uid() IS NULL OR auth.uid() <> current_seller) THEN
        UPDATE public.projects
        SET views = COALESCE(views, 0) + 1
        WHERE id = p_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- A11. STATS RPC (get_marketplace_stats)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_marketplace_stats()
RETURNS json AS $$
DECLARE
    v_live_total integer;
    v_for_sale integer;
    v_free_forks integer;
    v_open_collabs integer;
    v_resurrected integer;
    v_operatives integer;
BEGIN
    -- Live: not archived, not sold, and not collab filled
    SELECT COUNT(*) INTO v_live_total
    FROM public.projects
    WHERE COALESCE(is_archived, false) = false
      AND COALESCE(is_sold, false) = false
      AND COALESCE(is_collab_filled, false) = false;

    SELECT COUNT(*) INTO v_for_sale
    FROM public.projects
    WHERE interaction_type = 'buy'
      AND COALESCE(is_archived, false) = false
      AND COALESCE(is_sold, false) = false;

    SELECT COUNT(*) INTO v_free_forks
    FROM public.projects
    WHERE interaction_type = 'adopt'
      AND COALESCE(is_archived, false) = false;

    SELECT COUNT(*) INTO v_open_collabs
    FROM public.projects
    WHERE interaction_type = 'collab'
      AND COALESCE(is_archived, false) = false
      AND COALESCE(is_collab_filled, false) = false;

    -- Resurrected: sold buys + all claims + filled collabs
    SELECT 
        (SELECT COUNT(*) FROM public.projects WHERE interaction_type = 'buy' AND is_sold = true) +
        (SELECT COUNT(*) FROM public.transactions WHERE kind = 'adopt' AND status = 'completed') +
        (SELECT COUNT(*) FROM public.projects WHERE interaction_type = 'collab' AND is_collab_filled = true)
    INTO v_resurrected;

    SELECT COUNT(*) INTO v_operatives FROM public.profiles;

    RETURN json_build_object(
        'live_total', v_live_total,
        'for_sale', v_for_sale,
        'free_forks', v_free_forks,
        'open_collabs', v_open_collabs,
        'resurrected', v_resurrected,
        'operatives', v_operatives
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- A3, A6, A8, A9. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- 1. PROJECT ASSETS RLS
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers or authorized buyers can view project assets" ON public.project_assets;
CREATE POLICY "Sellers or authorized buyers can view project assets"
ON public.project_assets FOR SELECT
TO authenticated
USING (
    -- Caller is the seller
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_assets.project_id AND p.seller_id = auth.uid()
    )
    OR
    -- Caller is a buyer/claimer with completed transaction
    EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.project_id = project_assets.project_id 
          AND t.buyer_id = auth.uid() 
          AND t.status = 'completed'
    )
);

DROP POLICY IF EXISTS "Sellers can manage their project assets" ON public.project_assets;
CREATE POLICY "Sellers can manage their project assets"
ON public.project_assets FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_assets.project_id AND p.seller_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_assets.project_id AND p.seller_id = auth.uid()
    )
);


-- 2. TRANSACTIONS RLS (A6)
-- Only service_role creates/updates transactions. Authenticated buyers and sellers can SELECT.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert pending transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Sellers can update transactions for their projects" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions they are involved in" ON public.transactions;

CREATE POLICY "Users can view transactions they are involved in"
ON public.transactions FOR SELECT
TO authenticated
USING (
    auth.uid() = buyer_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = transactions.project_id 
          AND projects.seller_id = auth.uid()
    )
);


-- 3. COLLAB REQUESTS RLS (A9)
ALTER TABLE public.collab_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can view their own requests" ON public.collab_requests;
CREATE POLICY "Applicants can view their own requests"
ON public.collab_requests FOR SELECT
TO authenticated
USING (
    applicant_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = collab_requests.project_id AND p.seller_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Applicants can submit requests" ON public.collab_requests;
CREATE POLICY "Applicants can submit requests"
ON public.collab_requests FOR INSERT
TO authenticated
WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can withdraw own requests" ON public.collab_requests;
CREATE POLICY "Applicants can withdraw own requests"
ON public.collab_requests FOR UPDATE
TO authenticated
USING (applicant_id = auth.uid())
WITH CHECK (applicant_id = auth.uid() AND status = 'withdrawn');

DROP POLICY IF EXISTS "Project owners can update request status" ON public.collab_requests;
CREATE POLICY "Project owners can update request status"
ON public.collab_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = collab_requests.project_id AND p.seller_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = collab_requests.project_id AND p.seller_id = auth.uid()
    )
);


-- 4. NOTIFICATIONS RLS (A9)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- 5. MESSAGES RLS (A8)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own non-deleted messages" ON public.messages;
CREATE POLICY "Users can read their own non-deleted messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    (auth.uid() = sender_id AND COALESCE(deleted_by_sender, false) = false)
    OR 
    (auth.uid() = receiver_id AND COALESCE(deleted_by_receiver, false) = false)
);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update message read or delete status" ON public.messages;
CREATE POLICY "Users can update message read or delete status"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- ============================================================================
-- A7. STORAGE HARDENING & PUBLIC COVERS BUCKET
-- ============================================================================

-- Ensure project-files bucket is strictly private
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Create public project-covers bucket for thumbnails (images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-covers', 
    'project-covers', 
    true, 
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

-- Storage Policies for project-files
DROP POLICY IF EXISTS "Authenticated users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project files" ON storage.objects;

-- Strict user path-prefix: folder name must equal auth.uid()
CREATE POLICY "Users can upload their own project archives"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'project-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can manage their own project archives"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'project-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policies for project-covers
CREATE POLICY "Public read access to project covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-covers');

CREATE POLICY "Users can upload their own project covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'project-covers' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can manage their own project covers"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'project-covers' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- A8. ENABLE REALTIME
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
