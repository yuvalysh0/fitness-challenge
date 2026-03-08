import { DecimalPipe } from '@angular/common';
import { Component, inject, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { ChallengeService } from '../../core/challenge.service';
import { QuoteService } from '../../core/quote.service';
import type { DayLog } from '../../models';
import { ProgressReferenceCardComponent } from './progress-reference-card/progress-reference-card.component';
import { CHALLENGE_DAYS } from '../../models';
import { todayString } from '../../core/challenge.utils';
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
  imports: [
    MatProgressBarModule,
    MatCheckboxModule,
    BaseChartDirective,
    RouterLink,
    DecimalPipe,
    ProgressReferenceCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(ChallengeService);
  readonly quoteService = inject(QuoteService);

  ngOnInit(): void {
    this.quoteService.fetchQuoteOfTheDay();
  }

  readonly currentDay = this.store.currentDay;
  readonly progressPercent = this.store.progressPercent;
  readonly startDate = this.store.startDate;
  readonly dayLogs = this.store.dayLogs;
  readonly totalDays = CHALLENGE_DAYS;
  readonly daysCompleted = computed(() => Object.keys(this.store.dayLogs()).length);
  readonly daysRemaining = computed(() => CHALLENGE_DAYS - this.store.currentDay());

  readonly habits = this.store.habits;
  readonly todayLog = computed(() => {
    this.store.dayLogs();
    this.store.habits();
    return this.store.getOrCreateDayLog(todayString());
  });
  readonly habitsCompletedToday = computed(() => {
    const log = this.todayLog();
    const h = this.habits();
    return h.filter((habit) => log.habitChecks[habit.id]).length;
  });

  /** First unchecked habit for today (by order), or null if all done. */
  readonly nextHabit = computed(() => {
    const log = this.todayLog();
    const h = this.habits();
    return h.find((habit) => !log.habitChecks[habit.id]) ?? null;
  });

  toggleHabit(habitId: string): void {
    const current = this.todayLog().habitChecks[habitId];
    this.store.setHabitCheck(todayString(), habitId, !current);
  }

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

  formatChartDate(dateStr: string): string {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
