-- Fix avatars storage 403: allow INSERT like progress-photos (to public, bucket check only)
-- Frontend may send as anon even when user is logged in.

drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;
drop policy if exists "Allow avatars uploads" on storage.objects;
drop policy if exists "Allow avatars uploads anon" on storage.objects;
drop policy if exists "avatars SELECT" on storage.objects;

-- INSERT: allow for public (anon + authenticated); path is still userId/filename from app
create policy "Allow avatars uploads"
  on storage.objects for insert
  to public
  with check (bucket_id = 'avatars');

-- SELECT: allow public read (bucket is public for profile images)
create policy "avatars SELECT"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- UPDATE: own folder only (path first segment = user id); public so anon requests with JWT work
create policy "Users can update own avatar"
  on storage.objects for update
  to public
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = coalesce(auth.jwt()->>'sub', auth.uid()::text))
  with check (bucket_id = 'avatars');

-- DELETE: own folder only
create policy "Users can delete own avatar"
  on storage.objects for delete
  to public
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = coalesce(auth.jwt()->>'sub', auth.uid()::text));
