import { Injectable, inject, effect } from '@angular/core';
import type {
  ChallengeState,
  DayLog,
  MeasurementSet,
  HabitDefinition,
  FoodEntry,
  DateString,
} from '../models';
import type { DayLogRow, MeasurementRow, HabitRow } from './supabase.types';
import { ChallengeStore } from './challenge.store';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { todayString, defaultHabits, getDefaultState } from './challenge.utils';

const STORAGE_KEY = '75-hard-challenge';

function loadStateFromStorage(): ChallengeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChallengeState;
      return {
        ...parsed,
        habits: parsed.habits?.length ? parsed.habits : defaultHabits(),
      };
    }
  } catch {
    // ignore
  }
  return getDefaultState();
}

function saveStateToStorage(state: ChallengeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function rowToDayLog(row: DayLogRow): DayLog {
  return {
    date: row.date,
    weightKg: row.weight_kg ?? undefined,
    mood: row.mood ?? undefined,
    notes: row.notes ?? undefined,
    habitChecks: (row.habit_checks as Record<string, boolean>) ?? {},
    foodEntries: (row.food_entries as FoodEntry[]) ?? [],
    photoPath: row.photo_path ?? undefined,
    photoPathSide: row.photo_path_side ?? undefined,
  };
}

function rowToMeasurement(row: MeasurementRow): MeasurementSet {
  return {
    id: row.id,
    date: row.date,
    chest: row.chest ?? undefined,
    waist: row.waist ?? undefined,
    hips: row.hips ?? undefined,
    armL: row.arm_l ?? undefined,
    armR: row.arm_r ?? undefined,
    thighL: row.thigh_l ?? undefined,
    thighR: row.thigh_r ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function rowToHabit(row: HabitRow): HabitDefinition {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon ?? undefined,
    order: row.order,
  };
}

/**
 * Challenge I/O and persistence. Delegates state to ChallengeStore;
 * loads from / saves to Supabase when authenticated, localStorage when guest.
 */
@Injectable({ providedIn: 'root' })
export class ChallengeService {
  private readonly store = inject(ChallengeStore);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadFromSupabase();
      } else {
        this.store.setState(loadStateFromStorage());
      }
    });
  }

  // Read API (passthrough to store)
  readonly startDate = this.store.startDate;
  readonly dayLogs = this.store.dayLogs;
  readonly measurements = this.store.measurements;
  readonly habits = this.store.habits;
  readonly currentDay = this.store.currentDay;
  readonly progressPercent = this.store.progressPercent;

  getDayLog(date: DateString) {
    return this.store.getDayLog(date);
  }

  getOrCreateDayLog(date: DateString) {
    return this.store.getOrCreateDayLog(date);
  }

  // Write API (store + persist)
  setStartDate(date: DateString): void {
    this.store.setStartDate(date);
    this.persist();
  }

  updateDayLog(date: DateString, patch: Partial<DayLog>): void {
    this.store.updateDayLog(date, patch);
    this.persist();
  }

  addFoodEntry(date: DateString, entry: Omit<FoodEntry, 'id'>): void {
    this.store.addFoodEntry(date, entry);
    this.persist();
  }

  removeFoodEntry(date: DateString, entryId: string): void {
    this.store.removeFoodEntry(date, entryId);
    this.persist();
  }

  setHabitCheck(date: DateString, habitId: string, checked: boolean): void {
    this.store.setHabitCheck(date, habitId, checked);
    this.persist();
  }

  addMeasurement(measurement: MeasurementSet): void {
    this.store.addMeasurement(measurement);
    this.persist();
  }

  updateHabits(habits: HabitDefinition[]): void {
    this.store.updateHabits(habits);
    this.persist();
  }

  private persist(): void {
    if (this.auth.isAuthenticated()) {
      this.saveToSupabase();
    } else {
      saveStateToStorage(this.store.getState());
    }
  }

  private async loadFromSupabase(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const sb = this.supabase.supabase;

    const [settingsRes, dayLogsRes, measurementsRes, habitsRes] = await Promise.all([
      sb.from('challenge_settings').select('start_date').eq('user_id', userId).maybeSingle(),
      sb.from('day_logs').select('*').eq('user_id', userId),
      sb.from('measurements').select('*').eq('user_id', userId).order('date', { ascending: false }),
      sb.from('habits').select('*').eq('user_id', userId).order('order', { ascending: true }),
    ]);

    const startDate = (settingsRes.data?.start_date as string) ?? todayString();
    const dayLogs: Record<DateString, DayLog> = {};
    if (dayLogsRes.data?.length) {
      for (const row of dayLogsRes.data as DayLogRow[]) {
        dayLogs[row.date] = rowToDayLog(row);
      }
    }
    const measurements =
      (measurementsRes.data as MeasurementRow[] | null)?.map(rowToMeasurement) ?? [];
    const rawHabits = (habitsRes.data as HabitRow[] | null) ?? [];
    const habits = rawHabits.length > 0 ? rawHabits.map(rowToHabit) : defaultHabits();

    this.store.setState({
      startDate,
      dayLogs,
      measurements,
      habits,
    });

    const isNewUser = !settingsRes.data || !habitsRes.data?.length;
    if (isNewUser) {
      this.saveToSupabase();
    }
  }

  private saveToSupabase(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const s = this.store.getState();
    const sb = this.supabase.supabase;

    sb.from('challenge_settings')
      .upsert(
        { user_id: userId, start_date: s.startDate, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      .then(() => {});

    const dayLogRows = Object.values(s.dayLogs).map((log) => ({
      user_id: userId,
      date: log.date,
      weight_kg: log.weightKg ?? null,
      mood: log.mood ?? null,
      notes: log.notes ?? null,
      habit_checks: log.habitChecks,
      food_entries: log.foodEntries,
      photo_path: log.photoPath ?? null,
      photo_path_side: log.photoPathSide ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (dayLogRows.length > 0) {
      sb.from('day_logs')
        .upsert(dayLogRows, { onConflict: 'user_id,date' })
        .then(() => {});
    }

    sb.from('measurements')
      .delete()
      .eq('user_id', userId)
      .then(() => {
        if (s.measurements.length > 0) {
          const rows = s.measurements.map((m) => ({
            id: m.id,
            user_id: userId,
            date: m.date,
            chest: m.chest ?? null,
            waist: m.waist ?? null,
            hips: m.hips ?? null,
            arm_l: m.armL ?? null,
            arm_r: m.armR ?? null,
            thigh_l: m.thighL ?? null,
            thigh_r: m.thighR ?? null,
            notes: m.notes ?? null,
          }));
          sb.from('measurements')
            .insert(rows)
            .then(() => {});
        }
      });

    if (s.habits.length > 0) {
      const rows = s.habits.map((h) => ({
        id: h.id,
        user_id: userId,
        label: h.label,
        icon: h.icon ?? null,
        order: h.order,
      }));
      sb.from('habits')
        .upsert(rows, { onConflict: 'user_id,id' })
        .then(() => {});
    }
  }
}
