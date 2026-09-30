-- Allow authenticated users to insert transactions where they are the buyer
create policy "Users can insert their own transactions"
on transactions for insert
with check ( auth.uid() = buyer_id );
