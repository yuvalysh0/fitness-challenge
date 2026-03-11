import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, type OnboardingData } from '../../core/auth.service';
import { ChallengeService } from '../../core/challenge.service';
import { todayString } from '../../core/challenge.utils';
import { tdee, ageFromBirthDate } from '../../core/tdee.utils';
import { ActivityLevel, Sex, AppRoute } from '../../core/enums';

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
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly challenge = inject(ChallengeService);
  private readonly fb = inject(FormBuilder);

  readonly step = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly tdeeForm = this.fb.group({
    birthDate: ['', Validators.required],
    sex: [Sex.Male, Validators.required],
    heightCm: [170, [Validators.required, Validators.min(100), Validators.max(250)]],
    weightKg: [70, [Validators.required, Validators.min(30), Validators.max(300)]],
    activityLevel: [ActivityLevel.Moderate, Validators.required],
    goalWeightKg: [null as number | null],
  });

  readonly programForm = this.fb.group({
    programEndDate: ['', Validators.required],
  });

  readonly activityOptions = ACTIVITY_OPTIONS;
  readonly minEndDate = new Date();

  readonly tdeeResult = computed(() => {
    const g = this.tdeeForm.getRawValue();
    const bdStr = this.toDateString(g.birthDate);
    const sex = (g.sex as Sex | null) ?? Sex.Male;
    const activityLevel = (g.activityLevel as ActivityLevel | null) ?? ActivityLevel.Moderate;
    if (!bdStr || !g.heightCm || !g.weightKg) return null;
    const age = ageFromBirthDate(bdStr);
    if (age < 10 || age > 120) return null;
    return tdee(g.weightKg, g.heightCm, age, sex, activityLevel);
  });

  readonly programDays = computed(() => {
    const end = this.programForm.getRawValue().programEndDate;
    const endStr = this.toDateString(end);
    if (!endStr) return null;
    const endD = new Date(endStr);
    if (isNaN(endD.getTime())) return null;
    const start = new Date(todayString());
    const diff = Math.ceil((endD.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(1, diff);
  });

  private toDateString(v: string | Date | null | undefined): string | null {
    if (!v) return null;
    if (typeof v === 'string') return v.slice(0, 10);
    return v.toISOString().slice(0, 10);
  }

  nextStep(): void {
    this.errorMessage.set(null);
    if (this.step() === 1 && this.tdeeForm.valid) {
      this.step.set(2);
    }
  }

  prevStep(): void {
    this.step.update((s) => Math.max(1, s - 1));
    this.errorMessage.set(null);
  }

  async submit(): Promise<void> {
    this.errorMessage.set(null);
    const tdeeVal = this.tdeeForm.getRawValue();
    const programVal = this.programForm.getRawValue();
    if (this.tdeeForm.invalid || this.programForm.invalid) return;

    const birthDate = this.toDateString(tdeeVal.birthDate);
    const programEndDate = this.toDateString(programVal.programEndDate);
    if (!birthDate || !programEndDate) return;

    const data: OnboardingData = {
      birthDate,
      sex: tdeeVal.sex ?? Sex.Male,
      heightCm: tdeeVal.heightCm ?? 170,
      weightKg: tdeeVal.weightKg ?? 70,
      activityLevel: tdeeVal.activityLevel ?? ActivityLevel.Moderate,
      goalWeightKg: tdeeVal.goalWeightKg ?? undefined,
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
    this.loading.set(false);
    this.router.navigate([AppRoute.Home]);
  }
}
