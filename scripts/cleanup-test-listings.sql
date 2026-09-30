-- ==============================================================================
-- CLEANUP TEST LISTINGS SCRIPT
-- Deletes non-seed test projects and orphaned mock records safely.
-- Run in Supabase SQL editor if desired to wipe temporary test submissions.
-- ==============================================================================

-- 1. Delete transactions on non-seed projects
DELETE FROM public.transactions
WHERE project_id IN (
    SELECT id FROM public.projects WHERE seed_key IS NULL
);

-- 2. Delete collaboration requests on non-seed projects
DELETE FROM public.collaboration_requests
WHERE project_id IN (
    SELECT id FROM public.projects WHERE seed_key IS NULL
);

-- 3. Delete delivery assets on non-seed projects
DELETE FROM public.project_assets
WHERE project_id IN (
    SELECT id FROM public.projects WHERE seed_key IS NULL
);

-- 4. Delete non-seed projects
DELETE FROM public.projects
WHERE seed_key IS NULL;
