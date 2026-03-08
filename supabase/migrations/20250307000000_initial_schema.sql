-- 75 Hard challenge – initial schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) or via Supabase CLI.

-- Challenge settings: one row per user (start date for the 75-day challenge)
create table if not exists public.challenge_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Day logs: one row per user per date
create table if not exists public.day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2),
  mood text,
  notes text,
  habit_checks jsonb not null default '{}',
  food_entries jsonb not null default '[]',
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

-- Measurements: body measurements per user
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  chest numeric(5,2),
  waist numeric(5,2),
  hips numeric(5,2),
  arm_l numeric(5,2),
  arm_r numeric(5,2),
  thigh_l numeric(5,2),
  thigh_r numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

-- Habits: user-defined daily tasks (75 Hard defaults can be seeded per user)
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  icon text,
  "order" smallint not null default 0,
  created_at timestamptz not null default now()
);

-- RLS: enable and policies so users only see their own data
alter table public.challenge_settings enable row level security;
alter table public.day_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.habits enable row level security;

drop policy if exists "Users can manage own challenge_settings" on public.challenge_settings;
create policy "Users can manage own challenge_settings"
  on public.challenge_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own day_logs" on public.day_logs;
create policy "Users can manage own day_logs"
  on public.day_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own measurements" on public.measurements;
create policy "Users can manage own measurements"
  on public.measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own habits" on public.habits;
create policy "Users can manage own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for progress photos (create in Dashboard → Storage or via API)
-- Bucket name: progress-photos
-- RLS: users can upload/read/delete only their own folder (path: user_id/date.jpg)
