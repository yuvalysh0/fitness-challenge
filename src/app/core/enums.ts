/**
 * Central enums for the app. Import from here instead of using raw string literals.
 */

/** User's stored theme preference (includes "system" option). */
export enum Theme {
  Dark = 'dark',
  Light = 'light',
  System = 'system',
}

/** Biological sex for TDEE calculation. */
export enum Sex {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

/** Activity level for TDEE (Mifflin-St Jeor multipliers). */
export enum ActivityLevel {
  Sedentary = 'sedentary',
  Light = 'light',
  Moderate = 'moderate',
  Active = 'active',
  VeryActive = 'very_active',
}

/**
 * Supabase table names as constants. Use instead of raw string literals
 * so table renames are caught at compile time.
 */
export const DbTable = {
  Profiles: 'profiles',
  ChallengeSettings: 'challenge_settings',
  DayLogs: 'day_logs',
  Measurements: 'measurements',
  Habits: 'habits',
} as const;

export type DbTableName = (typeof DbTable)[keyof typeof DbTable];
