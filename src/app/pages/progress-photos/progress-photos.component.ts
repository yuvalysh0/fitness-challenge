import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChallengeStoreService } from '../../core/challenge-store.service';
import { SupabaseService } from '../../core/supabase.service';
import type { DayLog } from '../../models';
import { CHALLENGE_DAYS } from '../../models';

export interface ProgressPhotoEntry {
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
  selector: 'app-progress-photos',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './progress-photos.component.html',
  styleUrl: './progress-photos.component.scss',
})
export class ProgressPhotosComponent {
  private readonly store = inject(ChallengeStoreService);
  private readonly supabase = inject(SupabaseService);

  readonly totalDays = CHALLENGE_DAYS;
  readonly entries = computed(() => {
    const logs = this.store.dayLogs();
    const startDate = this.store.startDate();
    const list: ProgressPhotoEntry[] = [];
    for (const date of Object.keys(logs).sort()) {
      const log = logs[date] as DayLog;
      const hasPhoto = !!(log.photoPath || log.photoDataUrl);
      if (!hasPhoto) continue;
      list.push({
        date: log.date,
        dayNumber: dayNumberFromStart(startDate, log.date),
        weightKg: log.weightKg,
        photoPath: log.photoPath,
        photoDataUrl: log.photoDataUrl,
      });
    }
    return list.reverse();
  });

  getPhotoUrl(entry: ProgressPhotoEntry): string {
    if (entry.photoDataUrl) return entry.photoDataUrl;
    if (entry.photoPath) return this.supabase.getPublicPhotoUrl(entry.photoPath);
    return '';
  }
}
