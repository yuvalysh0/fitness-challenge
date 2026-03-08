import type { ChallengeState, HabitDefinition, DateString } from '../models';

export function todayString(): DateString {
  return new Date().toISOString().slice(0, 10);
}

export function defaultHabits(): HabitDefinition[] {
  return [
    { id: 'diet', label: 'Diet: no alcohol, no cheat meals', icon: '🥗', order: 0 },
    { id: 'water', label: '1 gallon (3.8 L) water', icon: '💧', order: 1 },
    { id: 'workout1', label: 'Workout 1 (45 min)', icon: '💪', order: 2 },
    { id: 'workout2', label: 'Workout 2 outdoor (45 min)', icon: '🌤️', order: 3 },
    { id: 'read', label: 'Read 10 pages (non-fiction)', icon: '📖', order: 4 },
  ];
}

export function getDefaultState(): ChallengeState {
  return {
    startDate: todayString(),
    dayLogs: {},
    measurements: [],
    habits: defaultHabits(),
  };
}
