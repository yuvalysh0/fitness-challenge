-- Onboarding: TDEE inputs and program end date
-- Profiles: add fields for TDEE calculator and onboarding completion
alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists sex text check (sex in ('male', 'female', 'other')),
  add column if not exists height_cm numeric(5,2),
  add column if not exists weight_kg numeric(5,2),
  add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  add column if not exists goal_weight_kg numeric(5,2),
  add column if not exists onboarding_completed_at timestamptz;

-- Challenge settings: add end_date for flexible program duration (null = legacy 75 days)
alter table public.challenge_settings
  add column if not exists end_date date;

comment on column public.profiles.onboarding_completed_at is 'Set when user completes the post-signup onboarding (TDEE + program end date).';
comment on column public.challenge_settings.end_date is 'Program end date. If null, challenge is 75 days from start_date.';
