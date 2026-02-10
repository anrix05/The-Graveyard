-- Enable the storage extension if not already enabled (usually defaults to on)
-- STORAGE SETUP

-- 1. Create the Bucket
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true);

-- 2. Security Policy: Allow Authenticated Users to Upload
create policy "Authenticated users can upload project files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'project-files' );

-- 3. Security Policy: Allow Users to Update/Delete THEIR OWN files
create policy "Users can update own project files"
on storage.objects for update
to authenticated
using ( bucket_id = 'project-files' AND auth.uid() = owner );

create policy "Users can delete own project files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'project-files' AND auth.uid() = owner );

-- 4. Security Policy: Public Read Access (Or restricted to purchased - for now Public for simplicity of demo)
-- Ideally, this should be "Authenticated users can download" or restricted to buyers.
create policy "Public Access to project files"
on storage.objects for select
to public
using ( bucket_id = 'project-files' );
