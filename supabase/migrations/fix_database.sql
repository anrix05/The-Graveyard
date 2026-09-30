-- FIX DATABASE SCHEMA & POLICIES

-- 1. Ensure the 'upi_id' column exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='upi_id') THEN
        ALTER TABLE public.profiles ADD COLUMN upi_id text;
    END IF;
END $$;

-- 2. Ensure RLS Policy for UPDATE allows users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 3. Ensure RLS Policy for INSERT allows users to insert their own profile (for upsert)
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- 4. Grant necessary permissions (just in case)
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
