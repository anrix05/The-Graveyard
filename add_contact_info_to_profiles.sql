-- Add contact_info column to profiles table
ALTER TABLE public.profiles
ADD COLUMN contact_info text;

-- Comment on column
COMMENT ON COLUMN public.profiles.contact_info IS 'Preferred contact method for collaborators (e.g. Discord ID, Signal, Email)';
