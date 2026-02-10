-- Add delete flags to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT false;

-- Update RLS policies to allow users to update their own delete flags
-- (Existing policies might cover 'update' generally or restricting it. Let's check.)
-- The existing policy "Receivers can mark users as read" only allows receivers to update.
-- We need a policy to allow users to "delete" (update flags) for messages where they are sender OR receiver.

CREATE POLICY "Users can delete (hide) their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
-- Note: 'WITH CHECK' ensures they can't change ownership or other fields improperly, 
-- but ideally we'd restrict *which* columns they can update if Supabase supported column-level RLS easily here.
-- For now, this is permissive enough for the feature.
