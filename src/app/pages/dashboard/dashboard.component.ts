import { DecimalPipe } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { ChallengeStoreService } from '../../core/challenge-store.service';
import { SupabaseService } from '../../core/supabase.service';
import type { DayLog, ProgressPhotoType } from '../../models';
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
  photoPathSide: string | undefined;
  photoDataUrlSide: string | undefined;
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
  imports: [MatProgressBarModule, BaseChartDirective, RouterLink, DecimalPipe],
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
      const hasAny =
        !!(log.photoPath || log.photoDataUrl) || !!(log.photoPathSide || log.photoDataUrlSide);
      if (!hasAny) continue;
      list.push({
        date: log.date,
        dayNumber: dayNumberFromStart(start, log.date),
        weightKg: log.weightKg,
        photoPath: log.photoPath,
        photoDataUrl: log.photoDataUrl,
        photoPathSide: log.photoPathSide,
        photoDataUrlSide: log.photoDataUrlSide,
      });
    }
    return list;
  });

  readonly firstPhoto = computed(() => this.photoRefEntries()[0] ?? null);
  readonly latestPhoto = computed(() => {
    const arr = this.photoRefEntries();
    return arr.length > 0 ? arr[arr.length - 1]! : null;
  });

  /** Chart.js bar chart data: labels = dates, dataset = weights */
  readonly weightChartDataConfig = computed((): ChartConfiguration<'bar'>['data'] => {
    const points = this.weightChartData();
    if (points.length === 0) return { labels: [], datasets: [] };
    return {
      labels: points.map((p) => this.formatChartDate(p.date)),
      datasets: [
        {
          label: 'Weight (kg)',
          data: points.map((p) => p.weight),
          backgroundColor: '#a78bfa',
        },
      ],
    };
  });

  /** Chart.js bar options: Y from 0, tooltip "X kg" */
  readonly weightChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => (typeof value === 'number' ? `${value} kg` : value),
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} kg`,
        },
      },
    },
  };

  getPhotoUrl(entry: PhotoRefEntry, type: ProgressPhotoType): string {
    if (type === 'front') {
      if (entry.photoDataUrl) return entry.photoDataUrl;
      if (entry.photoPath) return this.supabase.getPublicPhotoUrl(entry.photoPath);
    } else {
      if (entry.photoDataUrlSide) return entry.photoDataUrlSide;
      if (entry.photoPathSide) return this.supabase.getPublicPhotoUrl(entry.photoPathSide);
    }
    return '';
  }

  formatChartDate(dateStr: string): string {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
