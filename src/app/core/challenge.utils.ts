import type { ChallengeState, HabitDefinition, DateString } from '../models';

export function todayString(): DateString {
  return new Date().toISOString().slice(0, 10);
}

export function defaultHabits(): HabitDefinition[] {
  return [
    {
      id: 'diet',
      label: 'Diet: no alcohol, no cheat meals',
      icon: '🥗',
      order: 0,
      isDefault: true,
    },
    { id: 'water', label: '1 gallon (3.8 L) water', icon: '💧', order: 1, isDefault: true },
    { id: 'workout1', label: 'Workout 1 (45 min)', icon: '💪', order: 2, isDefault: true },
    { id: 'workout2', label: 'Workout 2 outdoor (45 min)', icon: '🌤️', order: 3, isDefault: true },
    { id: 'read', label: 'Read 10 pages (non-fiction)', icon: '📖', order: 4, isDefault: true },
  ];
}

export function getDefaultState(): ChallengeState {
  return {
    startDate: todayString(),
    endDate: null,
    dayLogs: {},
    measurements: [],
    habits: defaultHabits(),
  };
}

/** Number of days between start and end (inclusive). */
export function daysBetween(start: DateString, end: DateString): number {
  const a = new Date(start);
  const b = new Date(end);
  return Math.max(1, Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}
