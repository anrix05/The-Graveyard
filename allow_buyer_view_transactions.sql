
-- Allow buyers to view their own transactions
DROP POLICY IF EXISTS "Buyers can view own transactions" ON transactions;

CREATE POLICY "Buyers can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = buyer_id);
