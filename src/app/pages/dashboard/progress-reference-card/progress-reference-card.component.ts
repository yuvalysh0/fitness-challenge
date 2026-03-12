import { Component, input, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { AppRoute } from '../../../core/enums';
import type { ProgressPhotoType } from '../../../models';

export interface ProgressRefEntry {
  date: string;
  dayNumber: number;
  weightKg: number | undefined;
  photoPath: string | undefined;
  photoDataUrl: string | undefined;
  photoPathSide: string | undefined;
  photoDataUrlSide: string | undefined;
}

@Component({
  selector: 'app-progress-reference-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './progress-reference-card.component.html',
  styleUrl: './progress-reference-card.component.scss',
})
export class ProgressReferenceCardComponent {
  protected readonly AppRoute = AppRoute;
  private readonly supabase = inject(SupabaseService);

  readonly firstEntry = input<ProgressRefEntry | null>(null);
  readonly latestEntry = input<ProgressRefEntry | null>(null);
  readonly allEntries = input<ProgressRefEntry[]>([]);
  readonly totalDays = input.required<number>();

  /** Emits the index into allEntries to open the transformation gallery. */
  readonly openGallery = output<number>();
  /** Legacy single-photo click (kept for backward compat). */
  readonly photoClick = output<string>();

  openGalleryAt(entry: ProgressRefEntry): void {
    const idx = this.allEntries().findIndex((e) => e.date === entry.date);
    this.openGallery.emit(idx >= 0 ? idx : 0);
  }

  getPhotoUrl(entry: ProgressRefEntry, type: ProgressPhotoType): string {
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
