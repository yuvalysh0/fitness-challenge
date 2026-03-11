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
import { SupabaseService, PROGRESS_PHOTOS_BUCKET } from './supabase.service';
import { todayString, defaultHabits, getDefaultState } from './challenge.utils';
import { DbTable } from './enums';

const STORAGE_KEY = '75-hard-challenge';

function loadStateFromStorage(): ChallengeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ChallengeState>;
      const defaults = getDefaultState();
      return {
        ...defaults,
        ...parsed,
        startDate: parsed.startDate ?? defaults.startDate,
        endDate: parsed.endDate ?? defaults.endDate,
        dayLogs: parsed.dayLogs ?? defaults.dayLogs,
        measurements: parsed.measurements ?? defaults.measurements,
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
  const date = String(row.date).slice(0, 10);
  return {
    id: row.id,
    date,
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
      const user = this.auth.user();
      const isAuth = this.auth.isAuthenticated();
      if (isAuth && user?.id) {
        this.loadFromSupabase();
      } else if (!isAuth) {
        this.store.setState(loadStateFromStorage());
      }
    });
  }

  // Read API (passthrough to store)
  readonly startDate = this.store.startDate;
  readonly endDate = this.store.endDate;
  readonly totalDays = this.store.totalDays;
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

  setStartAndEndDate(start: DateString, end: DateString | null): void {
    this.store.setStartAndEndDate(start, end);
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

  removeMeasurement(id: string): void {
    this.store.removeMeasurement(id);
    this.persist();
  }

  updateHabits(habits: HabitDefinition[]): void {
    this.store.updateHabits(habits);
    this.persist();
  }

  /**
   * Restarts the challenge from today (Day 1) without deleting data: only updates start date.
   * Keeps all day logs, measurements, progress photos, and habits.
   */
  restartChallenge(): void {
    this.setStartDate(todayString());
  }

  /**
   * Resets the challenge to Day 1: clears all day logs, measurements, and progress photos;
   * sets start date to today. Keeps habits. Requires confirmation in the UI.
   */
  async resetChallenge(): Promise<void> {
    const userId = this.auth.user()?.id;
    const today = todayString();
    const currentHabits = this.store.getState().habits;

    if (this.auth.isAuthenticated() && userId) {
      await this.auth.resetOnboarding();
      const sb = this.supabase.supabase;
      await sb.from(DbTable.ChallengeSettings).upsert(
        {
          user_id: userId,
          start_date: today,
          end_date: this.store.endDate(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      await sb.from(DbTable.DayLogs).delete().eq('user_id', userId);
      await sb.from(DbTable.Measurements).delete().eq('user_id', userId);
      const { data: files } = await sb.storage.from(PROGRESS_PHOTOS_BUCKET).list(userId);
      if (files?.length) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await sb.storage.from(PROGRESS_PHOTOS_BUCKET).remove(paths);
      }
    }

    this.store.setState({
      startDate: today,
      endDate: null,
      dayLogs: {},
      measurements: [],
      habits: currentHabits.length > 0 ? currentHabits : defaultHabits(),
    });
    if (this.auth.isAuthenticated()) {
      this.saveToSupabase();
    } else {
      saveStateToStorage(this.store.getState());
    }
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
      sb
        .from(DbTable.ChallengeSettings)
        .select('start_date, end_date')
        .eq('user_id', userId)
        .maybeSingle(),
      sb.from(DbTable.DayLogs).select('*').eq('user_id', userId),
      sb
        .from(DbTable.Measurements)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      sb.from(DbTable.Habits).select('*').eq('user_id', userId).order('order', { ascending: true }),
    ]);

    if (measurementsRes.error) {
      console.warn('Failed to load measurements from Supabase:', measurementsRes.error);
    }

    const startDate = (settingsRes.data?.start_date as string) ?? todayString();
    const endDate = (settingsRes.data?.end_date as string | null) ?? null;
    const dayLogs: Record<DateString, DayLog> = {};
    if (dayLogsRes.data?.length) {
      for (const row of dayLogsRes.data as DayLogRow[]) {
        dayLogs[row.date] = rowToDayLog(row);
      }
    }
    const measurements =
      !measurementsRes.error && measurementsRes.data != null
        ? (measurementsRes.data as MeasurementRow[]).map(rowToMeasurement)
        : [];
    const rawHabits = (habitsRes.data as HabitRow[] | null) ?? [];
    const habits = rawHabits.length > 0 ? rawHabits.map(rowToHabit) : defaultHabits();

    this.store.setState({
      startDate,
      endDate,
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

    sb.from(DbTable.ChallengeSettings)
      .upsert(
        {
          user_id: userId,
          start_date: s.startDate,
          end_date: s.endDate,
          updated_at: new Date().toISOString(),
        } as { user_id: string; start_date: string; end_date: string | null; updated_at: string },
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
      sb.from(DbTable.DayLogs)
        .upsert(dayLogRows, { onConflict: 'user_id,date' })
        .then(() => {});
    }

    sb.from(DbTable.Measurements)
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
          sb.from(DbTable.Measurements)
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
      sb.from(DbTable.Habits)
        .upsert(rows, { onConflict: 'user_id,id' })
        .then(() => {});
    }
  }
}
