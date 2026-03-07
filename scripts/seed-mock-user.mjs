/**
 * Creates a mock Supabase user with 52 days of challenge data.
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from Dashboard → Settings → API).
 * Optional: MOCK_USER_EMAIL, MOCK_USER_PASSWORD (defaults: mock@75hard.local, MockPass123!)
 *
 * Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-mock-user.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.MOCK_USER_EMAIL || 'mock@75hard.local';
const PASSWORD = process.env.MOCK_USER_PASSWORD || 'MockPass123!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use the service_role key from Supabase Dashboard → Settings → API).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const HABITS = [
  { id: 'diet', label: 'Diet: no alcohol, no cheat meals', icon: '🥗', order: 0 },
  { id: 'water', label: '1 gallon (3.8 L) water', icon: '💧', order: 1 },
  { id: 'workout1', label: 'Workout 1 (45 min)', icon: '💪', order: 2 },
  { id: 'workout2', label: 'Workout 2 outdoor (45 min)', icon: '🌤️', order: 3 },
  { id: 'read', label: 'Read 10 pages (non-fiction)', icon: '📖', order: 4 },
];

const MOODS = ['Good', 'Great', 'Tired', 'Focused', 'Solid'];
const HABIT_CHECKS = { diet: true, water: true, workout1: true, workout2: true, read: true };

function dateString(d) {
  return d.toISOString().slice(0, 10);
}

function dateOffsetDays(ago) {
  const d = new Date();
  d.setDate(d.getDate() - ago);
  return dateString(d);
}

function buildDayLogs(userId) {
  const logs = [];
  const start = new Date();
  start.setDate(start.getDate() - 52);
  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const date = dateString(d);
    const weight = Math.round((72 - i * 0.055 + (Math.random() * 0.6 - 0.3)) * 100) / 100;
    const mood = MOODS[i % MOODS.length];
    const notes = i % 7 === 0 ? `Week ${Math.floor(i / 7) + 1} done.` : null;
    const foodEntries = i % 3 === 0
      ? [
          { id: randomUUID(), time: '08:00', description: 'Oatmeal, banana', calories: 350 },
          { id: randomUUID(), time: '13:00', description: 'Chicken salad', calories: 450 },
        ]
      : [];
    logs.push({
      user_id: userId,
      date,
      weight_kg: weight,
      mood,
      notes,
      habit_checks: HABIT_CHECKS,
      food_entries: foodEntries,
      photo_path: null,
      updated_at: new Date().toISOString(),
    });
  }
  return logs;
}

async function main() {
  let userId;

  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users?.find((u) => u.email === EMAIL);
  if (existingUser) {
    userId = existingUser.id;
    console.log('Using existing user:', EMAIL, userId);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) {
      console.error('Create user failed:', error.message);
      if (error.message?.toLowerCase().includes('not allowed') || error.message?.toLowerCase().includes('forbidden') || error.status === 403) {
        console.error('\nUse the SERVICE_ROLE key (secret), not the anon key. In Supabase: Settings → API → Project API keys → service_role (reveal and copy).');
      }
      process.exit(1);
    }
    userId = data.user.id;
    console.log('Created user:', EMAIL, userId);
  }

  const startDate = dateOffsetDays(52);

  // Clear existing app data for this user
  await supabase.from('day_logs').delete().eq('user_id', userId);
  await supabase.from('measurements').delete().eq('user_id', userId);
  await supabase.from('habits').delete().eq('user_id', userId);
  await supabase.from('challenge_settings').delete().eq('user_id', userId);

  await supabase.from('challenge_settings').insert({
    user_id: userId,
    start_date: startDate,
    updated_at: new Date().toISOString(),
  });

  await supabase.from('habits').insert(
    HABITS.map((h) => ({ ...h, user_id: userId }))
  );

  const dayLogs = buildDayLogs(userId);
  const { error: logsError } = await supabase.from('day_logs').upsert(dayLogs, { onConflict: 'user_id,date' });
  if (logsError) {
    console.error('day_logs insert failed:', logsError.message);
    process.exit(1);
  }

  await supabase.from('measurements').insert([
    { user_id: userId, date: dateOffsetDays(52), chest: 98, waist: 82, hips: 100, arm_l: 32, arm_r: 32, thigh_l: 58, thigh_r: 58, notes: 'Day 1' },
    { user_id: userId, date: dateOffsetDays(38), chest: 97.5, waist: 80, hips: 99, arm_l: 31.5, arm_r: 31.5, thigh_l: 57, thigh_r: 57, notes: 'Week 2' },
    { user_id: userId, date: dateOffsetDays(24), chest: 97, waist: 79, hips: 98, arm_l: 31, arm_r: 31, thigh_l: 56.5, thigh_r: 56.5, notes: 'Week 4' },
    { user_id: userId, date: dateOffsetDays(10), chest: 96.5, waist: 78, hips: 97.5, arm_l: 30.5, arm_r: 30.5, thigh_l: 56, thigh_r: 56, notes: 'Week 6' },
  ]);

  console.log('Seeded 52 days of logs, 5 habits, 4 measurements.');
  console.log('Log in with:', EMAIL, '/', PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
