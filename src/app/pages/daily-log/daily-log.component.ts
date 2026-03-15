import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import type { ProgressPhotoType } from '../../models';
import { ChallengeService } from '../../core/challenge.service';
import { AuthService } from '../../core/auth.service';
import { SupabaseService, PROGRESS_PHOTOS_BUCKET } from '../../core/supabase.service';
import { todayString } from '../../core/challenge.utils';
import { PhotoOverlayComponent } from '../../shared/photo-overlay/photo-overlay.component';
import { HabitChecklistComponent } from '../../shared/habit-checklist/habit-checklist.component';
export const MOOD_OPTIONS = [
  { emoji: '🔥', label: 'Fired Up' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😤', label: 'Stressed' },
] as const;

export const WORKOUT_TYPES = [
  'Cardio',
  'Strength',
  'HIIT',
  'Yoga / Flexibility',
  'Sports',
  'Other',
] as const;

@Component({
  selector: 'app-daily-log',
  standalone: true,
  imports: [FormsModule, PhotoOverlayComponent, HabitChecklistComponent],
  templateUrl: './daily-log.component.html',
  styleUrl: './daily-log.component.scss',
})
export class DailyLogComponent {
  private readonly store = inject(ChallengeService);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);

  readonly moodOptions = MOOD_OPTIONS;
  readonly workoutTypes = WORKOUT_TYPES;

  readonly today = todayString();
  readonly date = signal(todayString());

  constructor() {
    this.route.queryParams.subscribe((params) => {
      const d = params['date'];
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) this.date.set(d);
    });
  }

  readonly log = computed(() => this.store.getOrCreateDayLog(this.date()));
  readonly habits = this.store.habits;
  readonly currentDay = this.store.currentDay;
  readonly totalDays = this.store.totalDays;

  readonly habitsCompleted = computed(() => {
    const log = this.log();
    return this.habits().filter((h) => log.habitChecks[h.id]).length;
  });

  readonly allHabitsComplete = computed(() => this.habitsCompleted() === this.habits().length);

  readonly hasReadingHabit = computed(() => this.habits().some((h) => h.id === 'read'));

  readonly photoUploadingFront = signal(false);
  readonly photoUploadingSide = signal(false);
  readonly photoOverlayUrl = signal<string | null>(null);
  readonly submitWarning = signal<string | null>(null);
  readonly submitSuccess = signal(false);

  // Formatted date for display
  readonly formattedDate = computed(() => {
    const d = new Date(this.date() + 'Z');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  // ── Setters ────────────────────────────────────────────────────────────────
  setWeight(value: number): void {
    const w = isNaN(value) ? undefined : value;
    this.store.updateDayLog(this.date(), { weightKg: w });
  }

  setMood(emoji: string): void {
    const current = this.log().mood;
    this.store.updateDayLog(this.date(), { mood: current === emoji ? undefined : emoji });
  }

  setNotes(notes: string): void {
    this.store.updateDayLog(this.date(), { notes: notes || undefined });
  }

  // ── Photos ─────────────────────────────────────────────────────────────────
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

  async onPhotoChange(type: ProgressPhotoType, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    input.value = '';
    const date = this.date();
    const userId = this.auth.user()?.id;
    const suffix = type === 'front' ? 'front' : 'side';
    const setUploading = type === 'front' ? this.photoUploadingFront : this.photoUploadingSide;
    if (userId) {
      setUploading.set(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/${date}-${suffix}.${ext}`;
      const { error } = await this.supabase.supabase.storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .upload(path, file, { upsert: true });
      setUploading.set(false);
      if (error) return;
      if (type === 'front')
        this.store.updateDayLog(date, { photoDataUrl: undefined, photoPath: path });
      else this.store.updateDayLog(date, { photoDataUrlSide: undefined, photoPathSide: path });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'front')
          this.store.updateDayLog(date, { photoDataUrl: reader.result as string });
        else this.store.updateDayLog(date, { photoDataUrlSide: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  async removePhoto(type: ProgressPhotoType): Promise<void> {
    const date = this.date();
    const l = this.log();
    const path = type === 'front' ? l.photoPath : l.photoPathSide;
    if (this.auth.user()?.id && path) {
      await this.supabase.supabase.storage.from(PROGRESS_PHOTOS_BUCKET).remove([path]);
    }
    if (type === 'front')
      this.store.updateDayLog(date, { photoDataUrl: undefined, photoPath: undefined });
    else this.store.updateDayLog(date, { photoDataUrlSide: undefined, photoPathSide: undefined });
  }

  // ── Reading ────────────────────────────────────────────────────────────────
  setReadingPages(value: string): void {
    const pages = parseInt(value, 10);
    this.store.updateDayLog(this.date(), {
      readingPages: isNaN(pages) || pages < 0 ? undefined : pages,
    });
  }

  setReadingBook(value: string): void {
    this.store.updateDayLog(this.date(), { readingBook: value.trim() || undefined });
  }

  // ── Habits ─────────────────────────────────────────────────────────────────
  toggleHabit(habitId: string): void {
    const current = this.log().habitChecks[habitId];
    this.store.setHabitCheck(this.date(), habitId, !current);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  completeForgDay(): void {
    this.submitWarning.set(null);
    if (!this.allHabitsComplete()) {
      this.submitWarning.set(
        `${this.habitsCompleted()}/${this.habits().length} tasks complete. Are you sure you want to finalize this day?`,
      );
      return;
    }
    this.submitSuccess.set(true);
    setTimeout(() => this.submitSuccess.set(false), 3000);
  }

  confirmSubmit(): void {
    this.submitWarning.set(null);
    this.submitSuccess.set(true);
    setTimeout(() => this.submitSuccess.set(false), 3000);
  }
}
