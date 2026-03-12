/**
 * Seeds a mock Supabase user with realistic challenge data for testing.
 *
 * Prerequisites:
 *   SUPABASE_URL              – Project URL (Settings → API)
 *   SUPABASE_SERVICE_ROLE_KEY – Service role key (Settings → API → service_role)
 *
 * Optional overrides:
 *   MOCK_USER_EMAIL    (default: mock@forge.local)
 *   MOCK_USER_PASSWORD (default: MockPass123!)
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-mock-user.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ─── Config ────────────────────────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const EMAIL = process.env.MOCK_USER_EMAIL ?? 'mock@forge.local';
const PASSWORD = process.env.MOCK_USER_PASSWORD ?? 'MockPass123!';

const PROGRAM_DAYS = 52;
const START_WEIGHT_KG = 72;
const WEIGHT_LOSS_PER_DAY = 0.055; // ~3 kg over 52 days
const WEIGHT_NOISE_RANGE = 0.3;    // ± kg random noise

// ─── Supabase tables ────────────────────────────────────────────────────────
const DB = {
  DAY_LOGS: 'day_logs',
  MEASUREMENTS: 'measurements',
  HABITS: 'habits',
  CHALLENGE_SETTINGS: 'challenge_settings',
  PROFILES: 'profiles',
};

// ─── Static data ────────────────────────────────────────────────────────────
const HABITS = [
  { id: 'diet',     label: 'Diet: no alcohol, no cheat meals', icon: '🥗', order: 0 },
  { id: 'water',    label: '1 gallon (3.8 L) water',           icon: '💧', order: 1 },
  { id: 'workout1', label: 'Workout 1 (45 min)',                icon: '💪', order: 2 },
  { id: 'workout2', label: 'Workout 2 outdoor (45 min)',        icon: '🌤️', order: 3 },
  { id: 'read',     label: 'Read 10 pages (non-fiction)',       icon: '📖', order: 4 },
];

// Build habit_checks from HABITS so we never go out of sync
const HABIT_CHECKS = Object.fromEntries(HABITS.map((h) => [h.id, true]));

const MOODS = ['Good', 'Great', 'Tired', 'Focused', 'Solid'];

// ─── Helpers ────────────────────────────────────────────────────────────────
function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateString(d);
}

function randomWeight(dayIndex) {
  const noise = Math.random() * WEIGHT_NOISE_RANGE * 2 - WEIGHT_NOISE_RANGE;
  return Math.round((START_WEIGHT_KG - dayIndex * WEIGHT_LOSS_PER_DAY + noise) * 100) / 100;
}

async function mustSucceed(promise, label) {
  const { error } = await promise;
  if (error) {
    console.error(`✗ ${label}:`, error.message);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

// ─── Seed functions ─────────────────────────────────────────────────────────
async function resolveUser(supabase) {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users?.find((u) => u.email === EMAIL);
  if (existing) {
    console.log(`ℹ Using existing user: ${EMAIL} (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) {
    console.error('✗ Create user failed:', error.message);
    if (error.status === 403) {
      console.error('  → Use the SERVICE_ROLE key, not the anon key.');
    }
    process.exit(1);
  }
  console.log(`✓ Created user: ${EMAIL} (${data.user.id})`);
  return data.user.id;
}

async function clearUserData(supabase, userId) {
  for (const table of [DB.DAY_LOGS, DB.MEASUREMENTS, DB.HABITS, DB.CHALLENGE_SETTINGS]) {
    await mustSucceed(
      supabase.from(table).delete().eq('user_id', userId),
      `Cleared ${table}`,
    );
  }
}

async function seedChallenge(supabase, userId, startDate) {
  await mustSucceed(
    supabase.from(DB.CHALLENGE_SETTINGS).insert({
      user_id: userId,
      start_date: startDate,
      updated_at: new Date().toISOString(),
    }),
    'Seeded challenge_settings',
  );
}

async function seedHabits(supabase, userId) {
  await mustSucceed(
    supabase.from(DB.HABITS).insert(HABITS.map((h) => ({ ...h, user_id: userId }))),
    `Seeded ${HABITS.length} habits`,
  );
}

function buildDayLogs(userId) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - PROGRAM_DAYS);

  return Array.from({ length: PROGRAM_DAYS }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const foodEntries = i % 3 === 0
      ? [
          { id: randomUUID(), time: '08:00', description: 'Oatmeal, banana', calories: 350 },
          { id: randomUUID(), time: '13:00', description: 'Chicken salad',   calories: 450 },
        ]
      : [];

    return {
      user_id: userId,
      date: toDateString(date),
      weight_kg: randomWeight(i),
      mood: MOODS[i % MOODS.length],
      notes: i % 7 === 0 ? `Week ${Math.floor(i / 7) + 1} done.` : null,
      habit_checks: HABIT_CHECKS,
      food_entries: foodEntries,
      photo_path: null,
      photo_path_side: null,
      updated_at: new Date().toISOString(),
    };
  });
}

async function seedDayLogs(supabase, userId) {
  const logs = buildDayLogs(userId);
  await mustSucceed(
    supabase.from(DB.DAY_LOGS).upsert(logs, { onConflict: 'user_id,date' }),
    `Seeded ${logs.length} day logs`,
  );
}

async function seedMeasurements(supabase, userId) {
  const measurements = [
    { days_ago: PROGRAM_DAYS,      chest: 98,   waist: 82, hips: 100, arm_l: 32,   arm_r: 32,   thigh_l: 58,   thigh_r: 58,   notes: 'Day 1'  },
    { days_ago: PROGRAM_DAYS - 14, chest: 97.5, waist: 80, hips: 99,  arm_l: 31.5, arm_r: 31.5, thigh_l: 57,   thigh_r: 57,   notes: 'Week 2' },
    { days_ago: PROGRAM_DAYS - 28, chest: 97,   waist: 79, hips: 98,  arm_l: 31,   arm_r: 31,   thigh_l: 56.5, thigh_r: 56.5, notes: 'Week 4' },
    { days_ago: PROGRAM_DAYS - 42, chest: 96.5, waist: 78, hips: 97.5,arm_l: 30.5, arm_r: 30.5, thigh_l: 56,   thigh_r: 56,   notes: 'Week 6' },
  ];

  await mustSucceed(
    supabase.from(DB.MEASUREMENTS).insert(
      measurements.map(({ days_ago, ...rest }) => ({
        user_id: userId,
        date: daysAgo(days_ago),
        ...rest,
      })),
    ),
    `Seeded ${measurements.length} measurements`,
  );
}

// ─── Entry point ────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n── Forge mock-user seed ────────────────────────────────');

  const userId = await resolveUser(supabase);
  const startDate = daysAgo(PROGRAM_DAYS);

  await clearUserData(supabase, userId);
  await seedChallenge(supabase, userId, startDate);
  await seedHabits(supabase, userId);
  await seedDayLogs(supabase, userId);
  await seedMeasurements(supabase, userId);

  console.log('\n✅ Done. Log in with:');
  console.log('   Email:   ', EMAIL);
  console.log('   Password:', PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
