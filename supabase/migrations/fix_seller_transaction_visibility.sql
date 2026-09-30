-- Drop the existing restrictive policy
drop policy if exists "Users can view their own transactions." on public.transactions;

-- Create comprehensive view policy for both buyers and sellers
create policy "Users can view transactions they are involved in"
  on public.transactions for select
  using (
    auth.uid() = buyer_id
    or
    exists (
      select 1 from public.projects
      where projects.id = transactions.project_id
      and projects.seller_id = auth.uid()
    )
  );
