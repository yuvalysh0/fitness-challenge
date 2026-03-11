import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChallengeService } from '../../core/challenge.service';
import { AppRoute } from '../../core/enums';
import type { DayLog } from '../../models';

function dayNumberFromStart(startDate: string, logDate: string, totalDays: number): number {
  const start = new Date(startDate).getTime();
  const log = new Date(logDate).getTime();
  const day = Math.floor((log - start) / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(day, totalDays));
}

export interface HistoryEntry {
  date: string;
  dayNumber: number;
  tasksDone: number;
  tasksTotal: number;
  completed: boolean;
  weightKg: number | undefined;
  mood: string | undefined;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  protected readonly AppRoute = AppRoute;
  private readonly store = inject(ChallengeService);

  readonly startDate = this.store.startDate;
  readonly dayLogs = this.store.dayLogs;
  readonly habits = this.store.habits;

  readonly entries = computed(() => {
    const logs = this.store.dayLogs();
    const start = this.store.startDate();
    const totalDays = this.store.totalDays();
    const habitList = this.store.habits();
    const total = habitList.length;
    const list: HistoryEntry[] = [];
    for (const date of Object.keys(logs).sort((a, b) => b.localeCompare(a))) {
      const log = logs[date] as DayLog;
      const checks = log.habitChecks ?? {};
      const done = habitList.filter((h) => checks[h.id]).length;
      list.push({
        date,
        dayNumber: dayNumberFromStart(start, date, totalDays),
        tasksDone: done,
        tasksTotal: total,
        completed: total > 0 && done === total,
        weightKg: log.weightKg,
        mood: log.mood?.trim() || undefined,
      });
    }
    return list;
  });

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  moodPreview(mood: string | undefined, maxLen = 20): string {
    if (!mood) return '—';
    return mood.length <= maxLen ? mood : mood.slice(0, maxLen) + '…';
  }
}
