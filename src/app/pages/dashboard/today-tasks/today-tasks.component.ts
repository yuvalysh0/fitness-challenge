import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { HabitDefinition, DayLog } from '../../../models';
import { AppRoute } from '../../../core/enums';

@Component({
  selector: 'app-today-tasks',
  standalone: true,
  imports: [RouterLink, MatCheckboxModule],
  templateUrl: './today-tasks.component.html',
  styleUrl: './today-tasks.component.scss',
})
export class TodayTasksComponent {
  readonly habits = input.required<readonly HabitDefinition[]>();
  readonly todayLog = input.required<DayLog>();
  readonly habitsCompleted = input.required<number>();

  readonly habitToggled = output<string>();

  protected readonly AppRoute = AppRoute;

  toggle(habitId: string): void {
    this.habitToggled.emit(habitId);
  }
}
