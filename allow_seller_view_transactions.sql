
-- Allow sellers to view transactions for projects they own
-- This is needed so they can see "Collaborations" (who put a request on their project)
DROP POLICY IF EXISTS "Sellers can view transactions of their projects" ON transactions;

CREATE POLICY "Sellers can view transactions of their projects"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = transactions.project_id
    AND projects.seller_id = auth.uid()
  )
);
