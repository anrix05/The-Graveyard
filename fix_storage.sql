-- FIX STORAGE BUCKET & POLICIES

-- 1. Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Uploads" on storage.objects;
drop policy if exists "Users can upload their own files" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

-- 3. Create Permissive Policies for 'project-files'
-- Allow public read access to all files in the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'project-files' );

-- Allow authenticated users to upload files
create policy "Authenticated Uploads"
  on storage.objects for insert
  with check ( 
    bucket_id = 'project-files' 
    and auth.role() = 'authenticated'
  );

-- Allow users to update/delete their own files (Matched by folder name user_id/*)
create policy "Users can update their own files"
  on storage.objects for update
  using ( 
    bucket_id = 'project-files' 
    and auth.uid()::text = (storage.foldername(name))[1] 
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using ( 
    bucket_id = 'project-files' 
    and auth.uid()::text = (storage.foldername(name))[1] 
  );
