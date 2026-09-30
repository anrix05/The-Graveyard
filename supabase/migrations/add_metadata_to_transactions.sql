-- Add metadata column to transactions table for flexible data storage (e.g. Collab inputs)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
