-- Allow habit ids to be semantic strings (e.g. 'diet', 'water') for default 75 Hard habits
alter table public.habits
  alter column id type text using id::text,
  alter column id set default null;
