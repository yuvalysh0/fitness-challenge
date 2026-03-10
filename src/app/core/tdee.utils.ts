import type { ActivityLevel } from './supabase.types';

/** Mifflin-St Jeor BMR (kcal/day). */
export function bmrMifflinStJeor(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: 'male' | 'female' | 'other',
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === 'female') return base - 161;
  return base + 5; // male / other
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** TDEE (Total Daily Energy Expenditure) in kcal/day. */
export function tdee(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: 'male' | 'female' | 'other',
  activityLevel: ActivityLevel,
): number {
  const bmr = bmrMifflinStJeor(weightKg, heightCm, ageYears, sex);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/** Age in full years from birth date (YYYY-MM-DD). */
export function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
