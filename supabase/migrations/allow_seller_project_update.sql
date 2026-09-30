
-- Ensure sellers can update their own projects to mark them as filled
DROP POLICY IF EXISTS "Sellers can update own projects" ON projects;

CREATE POLICY "Sellers can update own projects"
ON projects FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);
