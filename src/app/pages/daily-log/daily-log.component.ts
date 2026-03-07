import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { ProgressPhotoType } from '../../models';
import { ChallengeStoreService } from '../../core/challenge-store.service';
import { AuthService } from '../../core/auth.service';
import { SupabaseService, PROGRESS_PHOTOS_BUCKET } from '../../core/supabase.service';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-daily-log',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './daily-log.component.html',
  styleUrl: './daily-log.component.scss',
})
export class DailyLogComponent {
  private readonly store = inject(ChallengeStoreService);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);

  readonly date = signal(todayString());

  constructor() {
    this.route.queryParams.subscribe((params) => {
      const d = params['date'];
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) this.date.set(d);
    });
  }
  readonly log = computed(() => {
    const d = this.date();
    return this.store.getOrCreateDayLog(d);
  });

  readonly habits = this.store.habits;
  readonly photoUploadingFront = signal(false);
  readonly photoUploadingSide = signal(false);
  newFoodDescription = '';
  newFoodTime = new Date().toTimeString().slice(0, 5);

  /** URL for a progress photo: data URL (guest) or Storage public URL (logged in). */
  getPhotoDisplayUrl(type: ProgressPhotoType): string | null {
    const l = this.log();
    if (type === 'front') {
      if (l.photoDataUrl) return l.photoDataUrl;
      if (l.photoPath) return this.supabase.getPublicPhotoUrl(l.photoPath);
    } else {
      if (l.photoDataUrlSide) return l.photoDataUrlSide;
      if (l.photoPathSide) return this.supabase.getPublicPhotoUrl(l.photoPathSide);
    }
    return null;
  }

  setWeight(weight: number | null): void {
    if (weight != null) {
      this.store.updateDayLog(this.date(), { weightKg: weight });
    }
  }

  setMood(mood: string): void {
    this.store.updateDayLog(this.date(), { mood: mood || undefined });
  }

  setNotes(notes: string): void {
    this.store.updateDayLog(this.date(), { notes: notes || undefined });
  }

  async onPhotoChange(type: ProgressPhotoType, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    input.value = '';

    const date = this.date();
    const userId = this.auth.user()?.id;
    const suffix = type === 'front' ? 'front' : 'side';
    const setUploading =
      type === 'front' ? this.photoUploadingFront.set : this.photoUploadingSide.set;

    if (userId) {
      setUploading(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/${date}-${suffix}.${ext}`;
      const { error } = await this.supabase.supabase.storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .upload(path, file, { upsert: true });
      setUploading(false);
      if (error) return;
      if (type === 'front') {
        this.store.updateDayLog(date, { photoDataUrl: undefined, photoPath: path });
      } else {
        this.store.updateDayLog(date, { photoDataUrlSide: undefined, photoPathSide: path });
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'front') {
          this.store.updateDayLog(date, { photoDataUrl: reader.result as string });
        } else {
          this.store.updateDayLog(date, { photoDataUrlSide: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  toggleHabit(habitId: string): void {
    const current = this.log().habitChecks[habitId];
    this.store.setHabitCheck(this.date(), habitId, !current);
  }

  addFood(): void {
    const desc = this.newFoodDescription.trim();
    if (!desc) return;
    this.store.addFoodEntry(this.date(), {
      time: this.newFoodTime,
      description: desc,
    });
    this.newFoodDescription = '';
    this.newFoodTime = new Date().toTimeString().slice(0, 5);
  }

  removeFood(entryId: string): void {
    this.store.removeFoodEntry(this.date(), entryId);
  }

  async removePhoto(type: ProgressPhotoType): Promise<void> {
    const date = this.date();
    const l = this.log();
    const path = type === 'front' ? l.photoPath : l.photoPathSide;
    const userId = this.auth.user()?.id;

    if (userId && path) {
      await this.supabase.supabase.storage.from(PROGRESS_PHOTOS_BUCKET).remove([path]);
    }
    if (type === 'front') {
      this.store.updateDayLog(date, { photoDataUrl: undefined, photoPath: undefined });
    } else {
      this.store.updateDayLog(date, { photoDataUrlSide: undefined, photoPathSide: undefined });
    }
  }
}
