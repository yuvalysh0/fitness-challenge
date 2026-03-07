import { Injectable, signal, computed, effect } from '@angular/core';
import {
  ChallengeState,
  DayLog,
  MeasurementSet,
  HabitDefinition,
  FoodEntry,
  DateString,
  CHALLENGE_DAYS,
} from '../models';
import type { DayLogRow, MeasurementRow, HabitRow } from './supabase.types';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

const STORAGE_KEY = '75-hard-challenge';

function todayString(): DateString {
  return new Date().toISOString().slice(0, 10);
}

/** 75 Hard: 5 daily non-negotiable tasks. Fail one = restart from Day 1. */
function defaultHabits(): HabitDefinition[] {
  return [
    { id: 'diet', label: 'Diet: no alcohol, no cheat meals', icon: '🥗', order: 0 },
    { id: 'water', label: '1 gallon (3.8 L) water', icon: '💧', order: 1 },
    { id: 'workout1', label: 'Workout 1 (45 min)', icon: '💪', order: 2 },
    { id: 'workout2', label: 'Workout 2 outdoor (45 min)', icon: '🌤️', order: 3 },
    { id: 'read', label: 'Read 10 pages (non-fiction)', icon: '📖', order: 4 },
  ];
}

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
  return {
    startDate: todayString(),
    dayLogs: {},
    measurements: [],
    habits: defaultHabits(),
  };
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
    photoDataUrl: undefined, // TODO: load from Storage when photo_path is set
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

@Injectable({ providedIn: 'root' })
export class ChallengeStoreService {
  private readonly state = signal<ChallengeState>(loadStateFromStorage());

  readonly startDate = computed(() => this.state().startDate);
  readonly dayLogs = computed(() => this.state().dayLogs);
  readonly measurements = computed(() => this.state().measurements);
  readonly habits = computed(() => this.state().habits);

  readonly currentDay = computed(() => {
    const start = new Date(this.state().startDate).getTime();
    const now = Date.now();
    const day = Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, Math.min(day, CHALLENGE_DAYS));
  });

  readonly progressPercent = computed(() => (this.currentDay() / CHALLENGE_DAYS) * 100);

  constructor(
    private readonly auth: AuthService,
    private readonly supabase: SupabaseService,
  ) {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadFromSupabase();
      } else {
        this.state.set(loadStateFromStorage());
      }
    });
  }

  getDayLog(date: DateString): DayLog | undefined {
    return this.state().dayLogs[date];
  }

  getOrCreateDayLog(date: DateString): DayLog {
    const existing = this.state().dayLogs[date];
    if (existing) return existing;
    const habits = this.state().habits;
    const habitChecks: Record<string, boolean> = {};
    for (const h of habits) {
      habitChecks[h.id] = false;
    }
    return {
      date,
      foodEntries: [],
      habitChecks,
    };
  }

  setStartDate(date: DateString): void {
    this.state.update((s) => ({ ...s, startDate: date }));
    this.persist();
  }

  updateDayLog(date: DateString, patch: Partial<DayLog>): void {
    this.state.update((s) => {
      const existing = s.dayLogs[date] ?? this.getOrCreateDayLog(date);
      const updated: DayLog = {
        ...existing,
        ...patch,
        date,
        habitChecks: { ...existing.habitChecks, ...(patch.habitChecks ?? {}) },
      };
      const dayLogs = { ...s.dayLogs, [date]: updated };
      return { ...s, dayLogs };
    });
    this.persist();
  }

  addFoodEntry(date: DateString, entry: Omit<FoodEntry, 'id'>): void {
    const log = this.getOrCreateDayLog(date);
    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    const foodEntries = [...log.foodEntries, newEntry];
    this.updateDayLog(date, { foodEntries });
  }

  removeFoodEntry(date: DateString, entryId: string): void {
    const log = this.getOrCreateDayLog(date);
    const foodEntries = log.foodEntries.filter((e) => e.id !== entryId);
    this.updateDayLog(date, { foodEntries });
  }

  setHabitCheck(date: DateString, habitId: string, checked: boolean): void {
    const log = this.getOrCreateDayLog(date);
    this.updateDayLog(date, {
      habitChecks: { ...log.habitChecks, [habitId]: checked },
    });
  }

  addMeasurement(measurement: MeasurementSet): void {
    this.state.update((s) => ({
      ...s,
      measurements: [...s.measurements, measurement].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    }));
    this.persist();
  }

  updateHabits(habits: HabitDefinition[]): void {
    this.state.update((s) => ({ ...s, habits }));
    this.persist();
  }

  private persist(): void {
    if (this.auth.isAuthenticated()) {
      this.saveToSupabase();
    } else {
      saveStateToStorage(this.state());
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
    const habits = (habitsRes.data as HabitRow[] | null)?.map(rowToHabit) ?? defaultHabits();

    this.state.set({
      startDate,
      dayLogs,
      measurements,
      habits,
    });
  }

  private saveToSupabase(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const s = this.state();
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
      photo_path: null,
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

    sb.from('habits')
      .delete()
      .eq('user_id', userId)
      .then(() => {
        if (s.habits.length > 0) {
          const rows = s.habits.map((h) => ({
            id: h.id,
            user_id: userId,
            label: h.label,
            icon: h.icon ?? null,
            order: h.order,
          }));
          sb.from('habits')
            .insert(rows)
            .then(() => {});
        }
      });
  }
}
