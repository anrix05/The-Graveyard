-- 1. Add phone_number to profiles (if you missed it earlier)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number text;

-- 2. Add payment_id to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_id text;

-- 3. Create helper function to mark project as sold securely
CREATE OR REPLACE FUNCTION mark_project_sold(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.projects
  SET is_sold = true
  WHERE id = p_id;
END;
$$;
