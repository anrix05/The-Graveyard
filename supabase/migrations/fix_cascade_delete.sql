
-- Drop the existing foreign key constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS "transactions_project_id_fkey";

-- Re-create it with ON DELETE CASCADE
ALTER TABLE transactions
    ADD CONSTRAINT "transactions_project_id_fkey"
    FOREIGN KEY ("project_id")
    REFERENCES "projects"("id")
    ON DELETE CASCADE;
