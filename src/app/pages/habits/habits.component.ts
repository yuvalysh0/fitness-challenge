import { Component, inject, signal } from '@angular/core';
import { ChallengeService } from '../../core/challenge.service';
import { HabitDefinition } from '../../models';
import { HabitFormRowComponent, HabitFormValue } from './habit-form-row/habit-form-row.component';

/** Emojis offered in the icon picker (fitness/habits + common). */
const EMOJI_OPTIONS = [
  '🥗',
  '💧',
  '💪',
  '🌤️',
  '📖',
  '🏃',
  '🧘',
  '📚',
  '☀️',
  '🛏️',
  '🍎',
  '🥑',
  '✨',
  '🎯',
  '📝',
  '🏋️',
  '🚴',
  '🧊',
  '🥛',
  '✓',
  '❤️',
  '⭐',
  '🔥',
  '💯',
  '🏆',
  '📅',
  '⏰',
  '🧴',
  '🪥',
  '🧹',
] as const;

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [HabitFormRowComponent],
  templateUrl: './habits.component.html',
  styleUrl: './habits.component.scss',
})
export class HabitsComponent {
  private readonly store = inject(ChallengeService);

  readonly emojiOptions = EMOJI_OPTIONS;
  readonly habits = this.store.habits;
  readonly editingId = signal<string | null>(null);
  readonly editingHabit = signal<HabitDefinition | null>(null);

  startAdd(): void {
    this.editingId.set('__new__');
    this.editingHabit.set(null);
  }

  startEdit(habit: HabitDefinition): void {
    this.editingId.set(habit.id);
    this.editingHabit.set(habit);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editingHabit.set(null);
  }

  save(value: HabitFormValue): void {
    const list = this.habits();
    if (this.editingId() === '__new__') {
      const newHabit: HabitDefinition = {
        id: crypto.randomUUID(),
        label: value.label,
        icon: value.icon || undefined,
        order: list.length,
      };
      this.store.updateHabits([...list, newHabit]);
    } else {
      const id = this.editingId();
      if (!id) return;
      const updated = list.map((h) =>
        h.id === id ? { ...h, label: value.label, icon: value.icon || undefined } : h,
      );
      this.store.updateHabits(updated);
    }
    this.cancelEdit();
  }

  remove(habitId: string): void {
    const updated = this.habits().filter((h) => h.id !== habitId);
    this.store.updateHabits(updated);
    if (this.editingId() === habitId) this.cancelEdit();
  }
}
