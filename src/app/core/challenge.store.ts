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
import { getDefaultState } from './challenge.utils';

@Injectable({ providedIn: 'root' })
export class ChallengeStore {
  private readonly state = signal<ChallengeState>(getDefaultState());

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

  getState(): ChallengeState {
    return this.state();
  }

  setState(state: ChallengeState): void {
    this.state.set(state);
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
  }

  removeMeasurement(id: string): void {
    this.state.update((s) => ({
      ...s,
      measurements: s.measurements.filter((m) => m.id !== id),
    }));
  }

  updateHabits(habits: HabitDefinition[]): void {
    this.state.update((s) => ({ ...s, habits }));
  }
}
