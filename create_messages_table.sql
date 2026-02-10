-- Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- Optional context
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. View messages (Sender or Receiver)
CREATE POLICY "Users can read their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. Send messages (Sender must be auth user)
CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- 3. Update messages (Mark as read - Receiver only)
CREATE POLICY "Receivers can mark users as read" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Enable Realtime
-- Note: You might need to check if the publication exists or run this in the dashboard if SQL fails on publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;
-- OR specifically for messages if you don't want all tables:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
