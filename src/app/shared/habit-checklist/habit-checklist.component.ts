import { Component, input, output } from '@angular/core';
import type { DayLog, HabitDefinition } from '../../models';

@Component({
  selector: 'app-habit-checklist',
  standalone: true,
  imports: [],
  templateUrl: './habit-checklist.component.html',
  styleUrl: './habit-checklist.component.scss',
  host: {
    '[class.habit-checklist--card]': 'variant() === "card"',
    '[class.habit-checklist--flat]': 'variant() === "flat"',
  },
})
export class HabitChecklistComponent {
  readonly habits = input.required<readonly HabitDefinition[]>();
  readonly log = input.required<DayLog>();
  readonly variant = input<'card' | 'flat'>('flat');

  readonly habitToggled = output<string>();
}
