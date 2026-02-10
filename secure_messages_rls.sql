-- Secure Messages RLS
-- Improve the SELECT policy to exclude messages marked as deleted by the user

-- Drop old policy
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;

-- Create new policy with deletion check
CREATE POLICY "Users can read their own non-deleted messages"
ON public.messages FOR SELECT
USING (
    (auth.uid() = sender_id AND deleted_by_sender = false) 
    OR 
    (auth.uid() = receiver_id AND deleted_by_receiver = false)
);
