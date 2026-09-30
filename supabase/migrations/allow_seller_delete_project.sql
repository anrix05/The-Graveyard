
-- Allow sellers to delete their own projects
DROP POLICY IF EXISTS "Sellers can delete own projects" ON projects;

CREATE POLICY "Sellers can delete own projects"
ON projects FOR DELETE
USING (auth.uid() = seller_id);
