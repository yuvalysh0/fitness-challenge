-- Add side progress photo path (front remains photo_path for backward compatibility)
alter table public.day_logs
  add column if not exists photo_path_side text;
