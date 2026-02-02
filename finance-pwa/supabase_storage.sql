-- Create a public bucket for files
-- Note: In Supabase Dashboard this is usually done via UI, but this SQL might work if permissions allow.
insert into storage.buckets (id, name, public) 
values ('files', 'files', true)
on conflict (id) do nothing;

-- Allow policies for the 'files' bucket
create policy "Public Access" 
  on storage.objects for select 
  using ( bucket_id = 'files' );

create policy "Authenticated Users can upload" 
  on storage.objects for insert 
  with check ( bucket_id = 'files' and auth.role() = 'authenticated' );
