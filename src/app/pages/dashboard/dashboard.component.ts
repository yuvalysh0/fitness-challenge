import { DecimalPipe } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChallengeStoreService } from '../../core/challenge-store.service';
import { SupabaseService } from '../../core/supabase.service';
import type { DayLog } from '../../models';
import { CHALLENGE_DAYS } from '../../models';

export interface WeightPoint {
  date: string;
  dayNumber: number;
  weight: number;
}

export interface PhotoRefEntry {
  date: string;
  dayNumber: number;
  weightKg: number | undefined;
  photoPath: string | undefined;
  photoDataUrl: string | undefined;
}

function dayNumberFromStart(startDate: string, logDate: string): number {
  const start = new Date(startDate).getTime();
  const log = new Date(logDate).getTime();
  const day = Math.floor((log - start) / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(day, CHALLENGE_DAYS));
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatProgressBarModule, RouterLink, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly store = inject(ChallengeStoreService);
  private readonly supabase = inject(SupabaseService);

  readonly currentDay = this.store.currentDay;
  readonly progressPercent = this.store.progressPercent;
  readonly startDate = this.store.startDate;
  readonly dayLogs = this.store.dayLogs;
  readonly totalDays = CHALLENGE_DAYS;
  readonly daysCompleted = computed(() => Object.keys(this.store.dayLogs()).length);
  readonly daysRemaining = computed(() => CHALLENGE_DAYS - this.store.currentDay());

  readonly weightChartData = computed(() => {
    const logs = this.store.dayLogs();
    const start = this.store.startDate();
    const points: WeightPoint[] = [];
    for (const date of Object.keys(logs).sort()) {
      const log = logs[date] as DayLog;
      const w = log.weightKg;
      if (w == null) continue;
      points.push({
        date: log.date,
        dayNumber: dayNumberFromStart(start, log.date),
        weight: w,
      });
    }
    return points;
  });

  readonly photoRefEntries = computed(() => {
    const logs = this.store.dayLogs();
    const start = this.store.startDate();
    const list: PhotoRefEntry[] = [];
    for (const date of Object.keys(logs).sort()) {
      const log = logs[date] as DayLog;
      if (!log.photoPath && !log.photoDataUrl) continue;
      list.push({
        date: log.date,
        dayNumber: dayNumberFromStart(start, log.date),
        weightKg: log.weightKg,
        photoPath: log.photoPath,
        photoDataUrl: log.photoDataUrl,
      });
    }
    return list;
  });

  readonly firstPhoto = computed(() => this.photoRefEntries()[0] ?? null);
  readonly latestPhoto = computed(() => {
    const arr = this.photoRefEntries();
    return arr.length > 0 ? arr[arr.length - 1]! : null;
  });

  readonly chartBounds = computed(() => {
    const points = this.weightChartData();
    if (points.length === 0)
      return { minDay: 1, maxDay: 75, minWeight: 50, maxWeight: 100, points: [] };
    const weights = points.map((p) => p.weight);
    const days = points.map((p) => p.dayNumber);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const padding = Math.max((maxW - minW) * 0.1, 2);
    return {
      minDay: Math.min(1, ...days),
      maxDay: Math.max(75, ...days),
      minWeight: minW - padding,
      maxWeight: maxW + padding,
      points,
    };
  });

  getPhotoUrl(entry: PhotoRefEntry): string {
    if (entry.photoDataUrl) return entry.photoDataUrl;
    if (entry.photoPath) return this.supabase.getPublicPhotoUrl(entry.photoPath);
    return '';
  }

  getChartPoints(): string {
    const b = this.chartBounds();
    if (b.points.length === 0) return '';
    const dayRange = b.maxDay - b.minDay || 1;
    const weightRange = b.maxWeight - b.minWeight || 1;
    return b.points
      .map(
        (p) =>
          `${((p.dayNumber - b.minDay) / dayRange) * 300},${120 - ((p.weight - b.minWeight) / weightRange) * 100}`,
      )
      .join(' ');
  }
}
