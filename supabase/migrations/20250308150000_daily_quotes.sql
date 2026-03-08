-- Store quote of the day per calendar date (one row per day, same for all users)
create table if not exists public.daily_quotes (
  date date primary key,
  quote text not null,
  author text not null,
  work text,
  created_at timestamptz not null default now()
);

alter table public.daily_quotes enable row level security;

-- Anyone can read (anon + authenticated) so the app can show today's quote
create policy "Anyone can read daily_quotes"
  on public.daily_quotes for select
  using (true);

-- Authenticated users can insert/update (e.g. when fetching from API and saving)
create policy "Authenticated can insert daily_quotes"
  on public.daily_quotes for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update daily_quotes"
  on public.daily_quotes for update
  using (auth.role() = 'authenticated');
