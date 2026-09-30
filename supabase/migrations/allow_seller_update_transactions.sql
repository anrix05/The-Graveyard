-- Policy to allow sellers to update transaction status (e.g. Accept/Reject collab requests)
create policy "Sellers can update transactions for their projects"
  on public.transactions for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = transactions.project_id
      and projects.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = transactions.project_id
      and projects.seller_id = auth.uid()
    )
  );
