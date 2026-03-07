import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChallengeStoreService } from '../../core/challenge-store.service';

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

  readonly date = signal(todayString());
  readonly log = computed(() => {
    const d = this.date();
    return this.store.getOrCreateDayLog(d);
  });

  readonly habits = this.store.habits;
  newFoodDescription = '';
  newFoodTime = new Date().toTimeString().slice(0, 5);

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

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.store.updateDayLog(this.date(), { photoDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    input.value = '';
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

  removePhoto(): void {
    this.store.updateDayLog(this.date(), { photoDataUrl: undefined });
  }
}
