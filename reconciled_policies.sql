-- AUTHORITATIVE CONSOLIDATED SECURITY POLICIES & CONSTRAINTS MIGRATION
-- Run this in your Supabase SQL Editor to establish a clean, strict security profile.

-- ============================================================================
-- 0. UNIQUE INTEGRITY CONSTRAINTS
-- ============================================================================

-- Ensure a project can have at most one completed purchase
DROP INDEX IF EXISTS unique_completed_project_purchase;
CREATE UNIQUE INDEX unique_completed_project_purchase 
ON public.transactions (project_id) 
WHERE (status = 'completed');

-- Ensure payment_id is unique across all transactions (if provided)
DROP INDEX IF EXISTS unique_payment_id_idx;
CREATE UNIQUE INDEX unique_payment_id_idx 
ON public.transactions (payment_id) 
WHERE (payment_id IS NOT NULL);


-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Anyone can select profiles
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- Users can only insert their own profile record (matches auth.uid)
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile record
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ============================================================================
-- 2. PROJECTS POLICIES
-- ============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Projects are viewable by everyone." ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects." ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects." ON public.projects;
DROP POLICY IF EXISTS "Sellers can update own projects." ON public.projects;
DROP POLICY IF EXISTS "Sellers can delete own projects." ON public.projects;

-- Anyone can view projects
CREATE POLICY "Projects are viewable by everyone."
ON public.projects FOR SELECT
USING (true);

-- Authenticated sellers can insert projects
CREATE POLICY "Users can insert their own projects."
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own projects
CREATE POLICY "Sellers can update own projects."
ON public.projects FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Sellers can delete their own projects
CREATE POLICY "Sellers can delete own projects."
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);


-- ============================================================================
-- 3. TRANSACTIONS POLICIES
-- ============================================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions they are involved in" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Buyers can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Sellers can view transactions of their projects" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert pending requests" ON public.transactions;
DROP POLICY IF EXISTS "Sellers can update transactions for their projects" ON public.transactions;

-- Users can read transactions where they are either the buyer OR the seller of the project
CREATE POLICY "Users can view transactions they are involved in"
ON public.transactions FOR SELECT
USING (
  auth.uid() = buyer_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = transactions.project_id 
    AND projects.seller_id = auth.uid()
  )
);

-- Users can ONLY insert pending transactions (for collaborations).
-- Completed transactions must be processed by the server-side verify-payment endpoint using the Service Role key.
CREATE POLICY "Users can insert pending transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id 
  AND status = 'pending'
);

-- Sellers can update transactions for their projects (e.g., accepting/rejecting a pending collaboration request)
CREATE POLICY "Sellers can update transactions for their projects"
ON public.transactions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = transactions.project_id
    AND projects.seller_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = transactions.project_id
    AND projects.seller_id = auth.uid()
  )
);


-- ============================================================================
-- 4. MESSAGES POLICIES
-- ============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read their own non-deleted messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Receivers can mark users as read" ON public.messages;
DROP POLICY IF EXISTS "Users can delete (hide) their own messages" ON public.messages;

-- View messages (only sender or receiver, and only if not marked deleted by that specific user)
CREATE POLICY "Users can read their own non-deleted messages"
ON public.messages FOR SELECT
USING (
  (auth.uid() = sender_id AND deleted_by_sender = false) 
  OR 
  (auth.uid() = receiver_id AND deleted_by_receiver = false)
);

-- Send messages
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Senders can update their own deleted flag
CREATE POLICY "Senders can mark messages as deleted"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id AND deleted_by_receiver = deleted_by_receiver AND is_read = is_read);

-- Receivers can mark messages as read and mark as deleted
CREATE POLICY "Receivers can update read and deleted status"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id AND deleted_by_sender = deleted_by_sender);


-- ============================================================================
-- 5. STORAGE POLICIES
-- ============================================================================

-- Ensure the project-files bucket is private (disallowing unauthenticated public downloads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Clean storage object policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to project files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own uploaded files" ON storage.objects;

-- Authenticated users can upload project files
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- Users can view/manage their own files (owner matches user uuid)
CREATE POLICY "Users can view own uploaded files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid() = owner);

CREATE POLICY "Users can update own project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid() = owner);

CREATE POLICY "Users can delete own project files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid() = owner);
