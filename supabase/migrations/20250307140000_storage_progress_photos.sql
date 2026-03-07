-- Progress photos bucket: public read, authenticated write to own folder (user_id/date.ext)
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do update set public = true;

-- Drop existing policies if re-running (e.g. after a fix)
drop policy if exists "Users can upload own progress photos" on storage.objects;
drop policy if exists "Users can update own progress photos" on storage.objects;
drop policy if exists "Users can delete own progress photos" on storage.objects;
drop policy if exists "Allow progress-photos uploads" on storage.objects;
drop policy if exists "Allow progress-photos uploads anon" on storage.objects;

-- RLS: allow INSERT for both roles (frontend often sends request as anon even when user is logged in).
create policy "Allow progress-photos uploads"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'progress-photos');

create policy "Allow progress-photos uploads anon"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'progress-photos' and auth.uid() is not null);

-- UPDATE/DELETE restricted to own folder (first path segment = auth.jwt()->>'sub').
create policy "Users can update own progress photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (auth.jwt()->>'sub'))
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (auth.jwt()->>'sub'));

create policy "Users can delete own progress photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (auth.jwt()->>'sub')
  );
