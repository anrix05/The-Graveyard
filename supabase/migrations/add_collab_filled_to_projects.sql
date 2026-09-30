
-- Add is_collab_filled column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_collab_filled BOOLEAN DEFAULT FALSE;
