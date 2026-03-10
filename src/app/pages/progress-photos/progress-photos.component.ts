import { Component, inject, computed, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChallengeService } from '../../core/challenge.service';
import { PhotoOverlayComponent } from '../../shared/photo-overlay/photo-overlay.component';
import { SupabaseService } from '../../core/supabase.service';
import type { DayLog, ProgressPhotoType } from '../../models';
export interface ProgressPhotoEntry {
  date: string;
  dayNumber: number;
  weightKg: number | undefined;
  photoPath: string | undefined;
  photoDataUrl: string | undefined;
  photoPathSide: string | undefined;
  photoDataUrlSide: string | undefined;
}

function dayNumberFromStart(startDate: string, logDate: string, totalDays: number): number {
  const start = new Date(startDate).getTime();
  const log = new Date(logDate).getTime();
  const day = Math.floor((log - start) / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(day, totalDays));
}

@Component({
  selector: 'app-progress-photos',
  standalone: true,
  imports: [MatCardModule, PhotoOverlayComponent],
  templateUrl: './progress-photos.component.html',
  styleUrl: './progress-photos.component.scss',
})
export class ProgressPhotosComponent {
  private readonly store = inject(ChallengeService);
  private readonly supabase = inject(SupabaseService);

  readonly totalDays = this.store.totalDays;
  readonly photoOverlayUrl = signal<string | null>(null);
  readonly entries = computed(() => {
    const logs = this.store.dayLogs();
    const startDate = this.store.startDate();
    const total = this.store.totalDays();
    const list: ProgressPhotoEntry[] = [];
    for (const date of Object.keys(logs).sort()) {
      const log = logs[date] as DayLog;
      const hasPhoto = !!(log.photoPath || log.photoDataUrl);
      if (!hasPhoto) continue;
      list.push({
        date: log.date,
        dayNumber: dayNumberFromStart(startDate, log.date, total),
        weightKg: log.weightKg,
        photoPath: log.photoPath,
        photoDataUrl: log.photoDataUrl,
        photoPathSide: log.photoPathSide,
        photoDataUrlSide: log.photoDataUrlSide,
      });
    }
    return list.reverse();
  });

  openPhotoOverlay(url: string | null): void {
    this.photoOverlayUrl.set(url ?? null);
  }

  closePhotoOverlay(): void {
    this.photoOverlayUrl.set(null);
  }

  getPhotoUrl(entry: ProgressPhotoEntry, type: ProgressPhotoType): string {
    if (type === 'front') {
      if (entry.photoDataUrl) return entry.photoDataUrl;
      if (entry.photoPath) return this.supabase.getPublicPhotoUrl(entry.photoPath);
    } else {
      if (entry.photoDataUrlSide) return entry.photoDataUrlSide;
      if (entry.photoPathSide) return this.supabase.getPublicPhotoUrl(entry.photoPathSide);
    }
    return '';
  }
}
