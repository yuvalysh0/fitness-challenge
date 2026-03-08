-- Allow each user to have their own habits with same semantic ids (e.g. 'diet', 'water')
-- Composite PK (user_id, id) so duplicate id across users is valid
alter table public.habits
  drop constraint if exists habits_pkey,
  add primary key (user_id, id);
