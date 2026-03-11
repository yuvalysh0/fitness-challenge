import { ActivityLevel, Sex } from './enums';

/** Mifflin-St Jeor BMR (kcal/day). */
export function bmrMifflinStJeor(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === Sex.Female) return base - 161;
  return base + 5; // male / other
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,
  [ActivityLevel.Light]: 1.375,
  [ActivityLevel.Moderate]: 1.55,
  [ActivityLevel.Active]: 1.725,
  [ActivityLevel.VeryActive]: 1.9,
};

/** TDEE (Total Daily Energy Expenditure) in kcal/day. */
export function tdee(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex,
  activityLevel: ActivityLevel,
): number {
  const bmr = bmrMifflinStJeor(weightKg, heightCm, ageYears, sex);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export interface MacroBreakdown {
  /** Target calories per day (TDEE minus deficit if losing weight). */
  readonly calories: number;
  /** Grams of protein per day (30% of calories). */
  readonly proteinG: number;
  /** Grams of carbohydrates per day (40% of calories). */
  readonly carbsG: number;
  /** Grams of fat per day (30% of calories). */
  readonly fatG: number;
  /** True when a calorie deficit was applied for weight loss. */
  readonly isDeficit: boolean;
}

/**
 * Calculates a balanced macro breakdown from a TDEE value.
 * Applies a ~400 kcal/day deficit when the goal weight is lower than current weight.
 * Split: Protein 30% | Carbs 40% | Fat 30%
 */
export function macroBreakdown(
  tdeeKcal: number,
  goalWeightKg?: number | null,
  currentWeightKg?: number | null,
): MacroBreakdown {
  const isDeficit =
    goalWeightKg != null && currentWeightKg != null && goalWeightKg < currentWeightKg;
  const calories = Math.max(1200, isDeficit ? tdeeKcal - 400 : tdeeKcal);
  return {
    calories,
    proteinG: Math.round((calories * 0.3) / 4),
    carbsG: Math.round((calories * 0.4) / 4),
    fatG: Math.round((calories * 0.3) / 9),
    isDeficit,
  };
}

/**
 * Estimates projected weight at the end of a program.
 *
 * Uses the 7,700 kcal ≈ 1 kg of body fat rule.
 * A positive deficit → weight loss; a surplus → weight gain.
 *
 * @param currentWeightKg  Starting weight in kg
 * @param tdeeKcal         Total Daily Energy Expenditure (maintenance calories)
 * @param targetCalories   Planned daily intake
 * @param programDays      Program duration in days
 * @returns Projected weight in kg, rounded to 1 decimal
 */
export function projectedWeight(
  currentWeightKg: number,
  tdeeKcal: number,
  targetCalories: number,
  programDays: number,
): number {
  const dailyDeficit = tdeeKcal - targetCalories;
  const totalDeficit = dailyDeficit * programDays;
  const weightChangeKg = totalDeficit / 7700;
  return Math.round((currentWeightKg - weightChangeKg) * 10) / 10;
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
