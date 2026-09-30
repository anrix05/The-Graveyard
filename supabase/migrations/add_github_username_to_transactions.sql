-- Add github_username to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS github_username text;

COMMENT ON COLUMN public.transactions.github_username IS 'GitHub username of the buyer provided during checkout';
