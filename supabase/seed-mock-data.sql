-- Mock data: 52 days of challenge data for an existing user.
--
-- 1. Create a user: Supabase Dashboard → Authentication → Users → Add user (e.g. mock@example.com).
-- 2. Copy the user's UUID from the Users table.
-- 3. Replace 00000000-0000-0000-0000-000000000000 below with that UUID (all 3 occurrences).
-- 4. Run this script in SQL Editor (Dashboard → SQL Editor → New query).

-- Replace this UUID with your test user's UUID (from Auth → Users)
DO $$
DECLARE
  uid uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Clear existing data for this user so you can re-run the seed
  DELETE FROM public.day_logs WHERE user_id = uid;
  DELETE FROM public.measurements WHERE user_id = uid;
  DELETE FROM public.habits WHERE user_id = uid;
  DELETE FROM public.challenge_settings WHERE user_id = uid;

  -- Challenge start date: 52 days ago
  INSERT INTO public.challenge_settings (user_id, start_date, updated_at)
  VALUES (uid, (current_date - 52), now());

  -- Default 75 Hard habits
  INSERT INTO public.habits (id, user_id, label, icon, "order") VALUES
    ('diet', uid, 'Diet: no alcohol, no cheat meals', '🥗', 0),
    ('water', uid, '1 gallon (3.8 L) water', '💧', 1),
    ('workout1', uid, 'Workout 1 (45 min)', '💪', 2),
    ('workout2', uid, 'Workout 2 outdoor (45 min)', '🌤️', 3),
    ('read', uid, 'Read 10 pages (non-fiction)', '📖', 4);

  -- 52 day logs: weight ~72kg down to ~69kg with small variance, all habits checked
  INSERT INTO public.day_logs (user_id, date, weight_kg, mood, notes, habit_checks, food_entries, updated_at)
  SELECT
    uid,
    (current_date - 52 + i)::date,
    round((72.0 - (i * 0.055) + (random() * 0.6 - 0.3))::numeric, 2),
    (array['Good', 'Great', 'Tired', 'Focused', 'Solid'])[1 + (i % 5)],
    CASE WHEN i % 7 = 0 THEN 'Week ' || (i/7 + 1) || ' done.' ELSE NULL END,
    '{"diet": true, "water": true, "workout1": true, "workout2": true, "read": true}'::jsonb,
    CASE
      WHEN i % 3 = 0 THEN
        ('[{"id":"' || gen_random_uuid() || '","time":"08:00","description":"Oatmeal, banana","calories":350},{"id":"' || gen_random_uuid() || '","time":"13:00","description":"Chicken salad","calories":450}]')::jsonb
      ELSE '[]'::jsonb
    END,
    now()
  FROM generate_series(0, 51) AS i;

  -- Measurements every ~2 weeks
  INSERT INTO public.measurements (id, user_id, date, chest, waist, hips, arm_l, arm_r, thigh_l, thigh_r, notes)
  VALUES
    (gen_random_uuid(), uid, (current_date - 52), 98, 82, 100, 32, 32, 58, 58, 'Day 1'),
    (gen_random_uuid(), uid, (current_date - 38), 97.5, 80, 99, 31.5, 31.5, 57, 57, 'Week 2'),
    (gen_random_uuid(), uid, (current_date - 24), 97, 79, 98, 31, 31, 56.5, 56.5, 'Week 4'),
    (gen_random_uuid(), uid, (current_date - 10), 96.5, 78, 97.5, 30.5, 30.5, 56, 56, 'Week 6');
END $$;
