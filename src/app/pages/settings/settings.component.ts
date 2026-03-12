import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';
import { ChallengeService } from '../../core/challenge.service';
import { PhotoOverlayComponent } from '../../shared/photo-overlay/photo-overlay.component';

interface SettingsFormModel {
  readonly fullName: string;
  readonly birthDate: string;
  readonly goalWeightKg: number;
  readonly challengeEndDate: string;
  readonly startingWeightKg: number;
}

function emptyFormModel(): SettingsFormModel {
  return {
    fullName: '',
    birthDate: '',
    goalWeightKg: 0,
    challengeEndDate: '',
    startingWeightKg: 0,
  };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormField, FormsModule, MatButtonModule, PhotoOverlayComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly challenge = inject(ChallengeService);
  private readonly router = inject(Router);

  readonly settingsModel = signal<SettingsFormModel>(emptyFormModel());
  readonly settingsForm = form(this.settingsModel);

  readonly avatarFile = signal<File | null>(null);
  readonly loading = signal(false);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly photoOverlayUrl = signal<string | null>(null);

  readonly profile = this.auth.profile;
  readonly startDate = this.challenge.startDate;
  readonly currentDay = this.challenge.currentDay;
  readonly totalDays = this.challenge.totalDays;

  ngOnInit(): void {
    const p = this.auth.profile();
    const startKg = this.challenge.getDayLog(this.challenge.startDate())?.weightKg ?? 0;

    this.settingsModel.set({
      fullName: p?.full_name ?? '',
      birthDate: p?.birth_date ?? '',
      goalWeightKg: p?.goal_weight_kg ?? 0,
      challengeEndDate: this.challenge.endDate() ?? '',
      startingWeightKg: startKg,
    });
  }

  avatarUrl(): string | null {
    return this.auth.avatarUrl();
  }

  openPhotoOverlay(url: string): void {
    this.photoOverlayUrl.set(url);
  }

  closePhotoOverlay(): void {
    this.photoOverlayUrl.set(null);
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.avatarFile.set(file && file.type.startsWith('image/') ? file : null);
    this.message.set(null);
  }

  onDateChange(field: 'birthDate' | 'challengeEndDate', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.settingsModel.update((m) => ({ ...m, [field]: value }));
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  async save(): Promise<void> {
    this.message.set(null);
    this.loading.set(true);

    const { fullName, birthDate, goalWeightKg, challengeEndDate, startingWeightKg } =
      this.settingsModel();

    const { error } = await this.auth.updateProfile({
      fullName: fullName.trim() || undefined,
      avatarFile: this.avatarFile() ?? undefined,
      birthDate: birthDate || undefined,
      goalWeightKg: goalWeightKg > 0 ? goalWeightKg : null,
    });

    if (error) {
      this.loading.set(false);
      this.message.set({ type: 'error', text: error.message ?? 'Failed to save settings' });
      return;
    }

    this.challenge.setStartAndEndDate(this.challenge.startDate(), challengeEndDate || null);

    if (startingWeightKg > 0) {
      this.challenge.updateDayLog(this.challenge.startDate(), { weightKg: startingWeightKg });
    }

    this.avatarFile.set(null);
    this.loading.set(false);
    this.message.set({ type: 'success', text: 'Settings saved' });
  }
}
