import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HabitDefinition, DayLog } from '../../../models';
import { AppRoute } from '../../../core/enums';
import { HabitChecklistComponent } from '../../../shared/habit-checklist/habit-checklist.component';

@Component({
  selector: 'app-today-tasks',
  standalone: true,
  imports: [RouterLink, HabitChecklistComponent],
  templateUrl: './today-tasks.component.html',
  styleUrl: './today-tasks.component.scss',
})
export class TodayTasksComponent {
  readonly habits = input.required<readonly HabitDefinition[]>();
  readonly todayLog = input.required<DayLog>();
  readonly habitsCompleted = input.required<number>();

  readonly habitToggled = output<string>();

  protected readonly AppRoute = AppRoute;
}
