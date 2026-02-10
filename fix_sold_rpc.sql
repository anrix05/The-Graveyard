-- Create a secure function to mark a project as sold
-- This uses 'security definer' to run with admin privileges, bypassing RLS
create or replace function mark_project_sold(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.projects
  set is_sold = true
  where id = p_id;
end;
$$;
