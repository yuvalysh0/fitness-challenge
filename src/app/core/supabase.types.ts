/** Row types for Supabase tables (match migration schema). */

export interface ChallengeSettingsRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Activity level for TDEE (Mifflin-St Jeor multipliers). */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface ProfileOnboardingRow {
  birth_date: string | null;
  sex: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal_weight_kg: number | null;
  onboarding_completed_at: string | null;
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
  photo_path_side: string | null;
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
