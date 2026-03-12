import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { AuthService, type OnboardingData } from '../../core/auth.service';
import { ChallengeService } from '../../core/challenge.service';
import { todayString } from '../../core/challenge.utils';
import {
  tdee,
  macroBreakdown,
  projectedWeight,
  ageFromBirthDate,
  type MacroBreakdown,
} from '../../core/tdee.utils';
import { ActivityLevel, Sex, AppRoute } from '../../core/enums';

interface TdeeFormModel {
  readonly birthDate: string;
  readonly sex: Sex;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly activityLevel: ActivityLevel;
  readonly goalWeightKg: number;
}

interface ProgramFormModel {
  readonly programEndDate: string;
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: ActivityLevel.Sedentary, label: 'Sedentary (little or no exercise)' },
  { value: ActivityLevel.Light, label: 'Light (1–3 days/week)' },
  { value: ActivityLevel.Moderate, label: 'Moderate (3–5 days/week)' },
  { value: ActivityLevel.Active, label: 'Active (6–7 days/week)' },
  { value: ActivityLevel.VeryActive, label: 'Very active (intense daily)' },
];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [DecimalPipe, FormField],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly challenge = inject(ChallengeService);

  readonly step = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly macrosResult = signal<MacroBreakdown | null>(null);
  readonly projectedWeightKg = signal<number | null>(null);
  readonly showErrors = signal(false);

  readonly tdeeModel = signal<TdeeFormModel>({
    birthDate: '',
    sex: Sex.Male,
    heightCm: 170,
    weightKg: 70,
    activityLevel: ActivityLevel.Moderate,
    goalWeightKg: 0,
  });
  readonly tdeeForm = form(this.tdeeModel);

  readonly programModel = signal<ProgramFormModel>({ programEndDate: '' });
  readonly programForm = form(this.programModel);

  readonly activityOptions = ACTIVITY_OPTIONS;
  readonly minEndDate = todayString();

  readonly maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    return d.toISOString().slice(0, 10);
  })();
  readonly minBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d.toISOString().slice(0, 10);
  })();

  readonly tdeeResult = computed(() => {
    const m = this.tdeeModel();
    if (!m.birthDate || m.heightCm <= 0 || m.weightKg <= 0) return null;
    const age = ageFromBirthDate(m.birthDate);
    if (age < 10 || age > 120) return null;
    return tdee(m.weightKg, m.heightCm, age, m.sex, m.activityLevel);
  });

  readonly programDays = computed(() => {
    const end = this.programModel().programEndDate;
    if (!end) return null;
    const endD = new Date(end);
    if (isNaN(endD.getTime())) return null;
    const diff = Math.ceil(
      (endD.getTime() - new Date(todayString()).getTime()) / (24 * 60 * 60 * 1000),
    );
    return Math.max(1, diff);
  });

  readonly tdeeFormValid = computed(() => {
    const m = this.tdeeModel();
    return (
      m.birthDate !== '' &&
      m.heightCm >= 100 &&
      m.heightCm <= 250 &&
      m.weightKg >= 30 &&
      m.weightKg <= 300
    );
  });

  readonly programFormValid = computed(() => this.programModel().programEndDate !== '');

  /** Macros for step 3 — uses submitted result or computes fresh from the signal model. */
  readonly macros = computed((): MacroBreakdown | null => {
    const submitted = this.macrosResult();
    if (submitted) return submitted;
    const tdeeKcal = this.tdeeResult();
    if (!tdeeKcal) return null;
    const m = this.tdeeModel();
    return macroBreakdown(tdeeKcal, m.goalWeightKg > 0 ? m.goalWeightKg : null, m.weightKg);
  });

  // Ring circumference for macro circles
  readonly ringC = 2 * Math.PI * 28; // r=28

  macroRingOffset(pct: number): number {
    return this.ringC * (1 - Math.min(pct, 100) / 100);
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tdeeModel.update((m) => ({ ...m, birthDate: value }));
  }

  onEndDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.programModel.update((m) => ({ ...m, programEndDate: value }));
  }

  nextStep(): void {
    this.showErrors.set(true);
    if (!this.tdeeFormValid()) return;
    this.showErrors.set(false);
    this.errorMessage.set(null);
    this.step.set(2);
  }

  prevStep(): void {
    this.step.update((s) => Math.max(1, s - 1));
    this.errorMessage.set(null);
    this.showErrors.set(false);
  }

  async submit(): Promise<void> {
    this.showErrors.set(true);
    if (!this.programFormValid()) return;
    this.showErrors.set(false);
    this.errorMessage.set(null);

    const m = this.tdeeModel();
    const programEndDate = this.programModel().programEndDate;

    const data: OnboardingData = {
      birthDate: m.birthDate,
      sex: m.sex,
      heightCm: m.heightCm,
      weightKg: m.weightKg,
      activityLevel: m.activityLevel,
      goalWeightKg: m.goalWeightKg > 0 ? m.goalWeightKg : undefined,
      programEndDate,
    };

    this.loading.set(true);
    const { error } = await this.auth.completeOnboarding(data);
    if (error) {
      this.loading.set(false);
      this.errorMessage.set(error.message ?? 'Something went wrong');
      return;
    }

    this.challenge.setStartAndEndDate(todayString(), programEndDate);

    // Compute TDEE and macros directly from raw values — never rely on computed signals
    // that may be cached stale due to reactive graph timing
    const age = ageFromBirthDate(m.birthDate);
    if (age >= 10 && age <= 120 && m.weightKg > 0 && m.heightCm > 0) {
      const tdeeKcal = tdee(m.weightKg, m.heightCm, age, m.sex, m.activityLevel);
      const goalKg = m.goalWeightKg > 0 ? m.goalWeightKg : null;
      const macros = macroBreakdown(tdeeKcal, goalKg, m.weightKg);
      this.macrosResult.set(macros);
      const days = this.programDays();
      if (days != null) {
        this.projectedWeightKg.set(projectedWeight(m.weightKg, tdeeKcal, macros.calories, days));
      }
    }

    this.loading.set(false);
    this.step.set(3);
  }

  goToDashboard(): void {
    this.router.navigate([AppRoute.Home]);
  }
}
