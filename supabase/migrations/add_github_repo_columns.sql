-- Add columns for GitHub Repository Linking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS github_repo_id text,
ADD COLUMN IF NOT EXISTS github_repo_full_name text, -- e.g. "owner/repo"
ADD COLUMN IF NOT EXISTS is_private_repo boolean DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.projects.github_repo_id IS 'Unique ID of the GitHub repository';
COMMENT ON COLUMN public.projects.github_repo_full_name IS 'Full name of the repository (owner/repo)';
