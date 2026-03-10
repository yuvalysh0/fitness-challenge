/** Date string in YYYY-MM-DD format */
export type DateString = string;

export type ProgressPhotoType = 'front' | 'side';

export interface DayLog {
  date: DateString;
  weightKg?: number;
  /** In-memory/base64 preview (guest or before upload). */
  photoDataUrl?: string;
  /** Storage path when persisted (e.g. userId/date-front.jpg). */
  photoPath?: string;
  /** Side progress photo – data URL (guest) or Storage path. */
  photoDataUrlSide?: string;
  photoPathSide?: string;
  mood?: string;
  notes?: string;
  foodEntries: FoodEntry[];
  habitChecks: Record<string, boolean>;
}

export interface FoodEntry {
  id: string;
  time: string;
  description: string;
  calories?: number;
}

export interface MeasurementSet {
  id: string;
  date: DateString;
  chest?: number;
  waist?: number;
  hips?: number;
  armL?: number;
  armR?: number;
  thighL?: number;
  thighR?: number;
  notes?: string;
}

export interface HabitDefinition {
  id: string;
  label: string;
  icon?: string;
  order: number;
}

export interface ChallengeState {
  startDate: DateString;
  endDate: DateString | null;
  dayLogs: Record<DateString, DayLog>;
  measurements: MeasurementSet[];
  habits: HabitDefinition[];
}

export const DEFAULT_CHALLENGE_DAYS = 75;
