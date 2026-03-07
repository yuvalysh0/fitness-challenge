import { Injectable, signal, computed } from '@angular/core';
import {
  ChallengeState,
  DayLog,
  MeasurementSet,
  HabitDefinition,
  FoodEntry,
  DateString,
  CHALLENGE_DAYS,
} from '../models';

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

function loadState(): ChallengeState {
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

function saveState(state: ChallengeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class ChallengeStoreService {
  private readonly state = signal<ChallengeState>(loadState());

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
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
    this.persist();
  }

  updateHabits(habits: HabitDefinition[]): void {
    this.state.update((s) => ({ ...s, habits }));
    this.persist();
  }

  private persist(): void {
    saveState(this.state());
  }
}
