-- Add is_archived column to projects table
alter table public.projects
add column if not exists is_archived boolean default false;
