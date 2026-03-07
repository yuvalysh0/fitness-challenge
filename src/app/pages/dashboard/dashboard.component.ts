import { DecimalPipe } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChallengeStoreService } from '../../core/challenge-store.service';
import { CHALLENGE_DAYS } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule, MatButtonModule, RouterLink, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly store = inject(ChallengeStoreService);

  readonly currentDay = this.store.currentDay;
  readonly progressPercent = this.store.progressPercent;
  readonly startDate = this.store.startDate;
  readonly dayLogs = this.store.dayLogs;

  readonly totalDays = CHALLENGE_DAYS;
  readonly daysCompleted = computed(() => Object.keys(this.store.dayLogs()).length);
  readonly daysRemaining = computed(() => CHALLENGE_DAYS - this.store.currentDay());
}
