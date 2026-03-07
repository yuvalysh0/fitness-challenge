import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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

  readonly date = signal(todayString());
  readonly log = computed(() => {
    const d = this.date();
    return this.store.getOrCreateDayLog(d);
  });

  readonly habits = this.store.habits;
  readonly photoUploading = signal(false);
  newFoodDescription = '';
  newFoodTime = new Date().toTimeString().slice(0, 5);

  /** URL for the progress photo: data URL (guest) or Storage public URL (logged in). */
  getPhotoDisplayUrl(): string | null {
    const l = this.log();
    if (l.photoDataUrl) return l.photoDataUrl;
    if (l.photoPath) return this.supabase.getPublicPhotoUrl(l.photoPath);
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

  async onPhotoChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    input.value = '';

    const date = this.date();
    const userId = this.auth.user()?.id;

    if (userId) {
      this.photoUploading.set(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/${date}.${ext}`;
      const { error } = await this.supabase.supabase.storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .upload(path, file, { upsert: true });
      this.photoUploading.set(false);
      if (error) return;
      this.store.updateDayLog(date, {
        photoDataUrl: undefined,
        photoPath: path,
      });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        this.store.updateDayLog(date, {
          photoDataUrl: reader.result as string,
        });
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

  async removePhoto(): Promise<void> {
    const date = this.date();
    const l = this.log();
    const path = l.photoPath;
    const userId = this.auth.user()?.id;

    if (userId && path) {
      await this.supabase.supabase.storage.from(PROGRESS_PHOTOS_BUCKET).remove([path]);
    }
    this.store.updateDayLog(date, {
      photoDataUrl: undefined,
      photoPath: undefined,
    });
  }
}
