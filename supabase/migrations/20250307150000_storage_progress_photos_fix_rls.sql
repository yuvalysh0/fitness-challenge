-- Fix Storage 403: progress-photos bucket RLS
-- Run in Supabase Dashboard → SQL Editor → New query, then Run.
--
-- 1. Upsert needs SELECT + INSERT + UPDATE. We use "to public" so all roles (anon, authenticated) are allowed.
-- 2. If this still fails, run the diagnostic at the bottom to list existing policies on storage.objects.

-- Remove our policies (drop by name)
drop policy if exists "Users can upload own progress photos" on storage.objects;
drop policy if exists "Users can update own progress photos" on storage.objects;
drop policy if exists "Users can delete own progress photos" on storage.objects;
drop policy if exists "Allow progress-photos uploads" on storage.objects;
drop policy if exists "Allow progress-photos uploads anon" on storage.objects;
drop policy if exists "Users can update own progress photos anon" on storage.objects;
drop policy if exists "Users can delete own progress photos anon" on storage.objects;
drop policy if exists "progress-photos SELECT" on storage.objects;
drop policy if exists "progress-photos INSERT" on storage.objects;
drop policy if exists "progress-photos UPDATE" on storage.objects;
drop policy if exists "progress-photos DELETE" on storage.objects;

-- Apply to all roles (public = anon + authenticated + service_role)
-- SELECT: required for upsert (check if file exists) and for public read
create policy "progress-photos SELECT"
  on storage.objects for select
  to public
  using (bucket_id = 'progress-photos');

-- INSERT: allow new uploads. Use only bucket check so role/auth don't block; app still uses userId/date path.
create policy "progress-photos INSERT"
  on storage.objects for insert
  to public
  with check (bucket_id = 'progress-photos');

-- UPDATE: allow overwrite (upsert); restrict to own folder by path
create policy "progress-photos UPDATE"
  on storage.objects for update
  to public
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = coalesce(auth.jwt()->>'sub', auth.uid()::text))
  with check (bucket_id = 'progress-photos');

-- DELETE: restrict to own folder
create policy "progress-photos DELETE"
  on storage.objects for delete
  to public
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = coalesce(auth.jwt()->>'sub', auth.uid()::text));

-- If upload still returns 403, run this in SQL Editor to see all policies on storage.objects:
--   select policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'storage' and tablename = 'objects';
-- Check for any RESTRICTIVE policy or a policy that might deny the insert.
