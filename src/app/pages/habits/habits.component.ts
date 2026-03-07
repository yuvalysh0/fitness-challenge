import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChallengeStoreService } from '../../core/challenge-store.service';
import { HabitDefinition } from '../../models';

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  templateUrl: './habits.component.html',
  styleUrl: './habits.component.scss',
})
export class HabitsComponent {
  private readonly store = inject(ChallengeStoreService);

  readonly habits = this.store.habits;
  editingId = signal<string | null>(null);
  newLabel = signal('');
  newIcon = signal('✓');

  startAdd(): void {
    this.editingId.set('__new__');
    this.newLabel.set('');
    this.newIcon.set('✓');
  }

  startEdit(habit: HabitDefinition): void {
    this.editingId.set(habit.id);
    this.newLabel.set(habit.label);
    this.newIcon.set(habit.icon ?? '✓');
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  save(): void {
    const label = this.newLabel().trim();
    if (!label) return;
    const list = this.habits();
    if (this.editingId() === '__new__') {
      const newHabit: HabitDefinition = {
        id: crypto.randomUUID(),
        label,
        icon: this.newIcon() || undefined,
        order: list.length,
      };
      this.store.updateHabits([...list, newHabit]);
    } else {
      const id = this.editingId();
      if (!id) return;
      const updated = list.map((h) =>
        h.id === id ? { ...h, label, icon: this.newIcon() || undefined } : h
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
