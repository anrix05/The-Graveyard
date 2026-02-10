-- Add repo_link column to projects table
alter table public.projects
add column if not exists repo_link text;
