import { Injectable, signal, computed } from '@angular/core';
import {
  ChallengeState,
  DayLog,
  MeasurementSet,
  HabitDefinition,
  FoodEntry,
  DateString,
  DEFAULT_CHALLENGE_DAYS,
} from '../models';
import { getDefaultState, daysBetween } from './challenge.utils';

@Injectable({ providedIn: 'root' })
export class ChallengeStore {
  private readonly state = signal<ChallengeState>(getDefaultState());

  readonly startDate = computed(() => this.state().startDate);
  readonly endDate = computed(() => this.state().endDate);
  readonly dayLogs = computed(() => this.state().dayLogs);
  readonly measurements = computed(() => this.state().measurements);
  readonly habits = computed(() => this.state().habits);

  readonly totalDays = computed(() => {
    const s = this.state();
    if (s.endDate) return daysBetween(s.startDate, s.endDate);
    return DEFAULT_CHALLENGE_DAYS;
  });

  readonly currentDay = computed(() => {
    const start = new Date(this.state().startDate).getTime();
    const now = Date.now();
    const day = Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1;
    const total = this.totalDays();
    return Math.max(1, Math.min(day, total));
  });

  readonly progressPercent = computed(() => (this.currentDay() / this.totalDays()) * 100);

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
      habitChecks,
      habitNotes: {},
    };
  }

  setStartDate(date: DateString): void {
    this.state.update((s) => ({ ...s, startDate: date }));
  }

  setEndDate(date: DateString | null): void {
    this.state.update((s) => ({ ...s, endDate: date }));
  }

  setStartAndEndDate(start: DateString, end: DateString | null): void {
    this.state.update((s) => ({ ...s, startDate: start, endDate: end }));
  }

  updateDayLog(date: DateString, patch: Partial<DayLog>): void {
    this.state.update((s) => {
      const existing = s.dayLogs[date] ?? this.getOrCreateDayLog(date);
      const updated: DayLog = {
        ...existing,
        ...patch,
        date,
        habitChecks: { ...existing.habitChecks, ...(patch.habitChecks ?? {}) },
        habitNotes: { ...existing.habitNotes, ...(patch.habitNotes ?? {}) },
      };
      const dayLogs = { ...s.dayLogs, [date]: updated };
      return { ...s, dayLogs };
    });
  }

  setHabitCheck(date: DateString, habitId: string, checked: boolean): void {
    const log = this.getOrCreateDayLog(date);
    this.updateDayLog(date, {
      habitChecks: { ...log.habitChecks, [habitId]: checked },
    });
  }

  setHabitNote(date: DateString, habitId: string, note: string): void {
    const log = this.getOrCreateDayLog(date);
    const habitNotes = { ...log.habitNotes };
    if (note.trim()) {
      habitNotes[habitId] = note;
    } else {
      delete habitNotes[habitId];
    }
    this.updateDayLog(date, { habitNotes });
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
