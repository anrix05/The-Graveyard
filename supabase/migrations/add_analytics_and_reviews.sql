-- Add views column to projects if it doesn't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;



-- Function to safely increment views
CREATE OR REPLACE FUNCTION increment_project_view(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.projects
  SET views = views + 1
  WHERE id = p_id;
END;
$$;
