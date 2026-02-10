
-- 1. Add is_collab_filled column if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_collab_filled BOOLEAN DEFAULT FALSE;

-- 2. Enable RLS on projects just in case (usually already on)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Create (or Re-create) the Policy to allow Sellers to UPDATE their projects
-- First drop to ensure clean slate
DROP POLICY IF EXISTS "Sellers can update own projects" ON projects;

-- Create the policy
CREATE POLICY "Sellers can update own projects"
ON projects FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- 4. Grant update permissions to authenticated users (RLS restricts which rows)
GRANT UPDATE ON TABLE projects TO authenticated;

-- 5. Reload PostgREST schema cache to ensure the new column is visible to the API immediately
NOTIFY pgrst, 'reload config';
