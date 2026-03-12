import { Component, input, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-forge-ring',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './forge-ring.component.html',
  styleUrl: './forge-ring.component.scss',
})
export class ForgeRingComponent {
  readonly progressPercent = input.required<number>();
  readonly currentDay = input.required<number>();
  readonly totalDays = input.required<number>();
  readonly daysCompleted = input.required<number>();
  readonly daysRemaining = input.required<number>();
  readonly habitsRemaining = input.required<number>();

  readonly ringCircumference = 2 * Math.PI * 54; // r=54
  readonly ringOffset = computed(
    () => this.ringCircumference * (1 - Math.min(this.progressPercent(), 100) / 100),
  );

  readonly ringFlipped = signal(false);
  private flipTimer: ReturnType<typeof setTimeout> | null = null;

  toggleFlip(): void {
    if (this.flipTimer) {
      clearTimeout(this.flipTimer);
      this.flipTimer = null;
    }
    const next = !this.ringFlipped();
    this.ringFlipped.set(next);
    if (next) {
      this.flipTimer = setTimeout(() => {
        this.ringFlipped.set(false);
        this.flipTimer = null;
      }, 3000);
    }
  }
}
