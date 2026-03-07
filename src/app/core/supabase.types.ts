/** Row types for Supabase tables (match migration schema). */

export interface ChallengeSettingsRow {
  id: string;
  user_id: string;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface DayLogRow {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number | null;
  mood: string | null;
  notes: string | null;
  habit_checks: Record<string, boolean>;
  food_entries: Array<{ id: string; time: string; description: string; calories?: number }>;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementRow {
  id: string;
  user_id: string;
  date: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arm_l: number | null;
  arm_r: number | null;
  thigh_l: number | null;
  thigh_r: number | null;
  notes: string | null;
  created_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  label: string;
  icon: string | null;
  order: number;
  created_at: string;
}
