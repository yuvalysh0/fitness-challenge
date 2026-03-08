import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';
import { PhotoOverlayComponent } from '../../shared/photo-overlay/photo-overlay.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PhotoOverlayComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);

  readonly fullName = signal('');
  readonly avatarFile = signal<File | null>(null);
  readonly loading = signal(false);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly photoOverlayUrl = signal<string | null>(null);

  readonly profile = this.auth.profile;

  constructor() {
    effect(() => {
      const p = this.auth.profile();
      if (p?.full_name != null) this.fullName.set(p.full_name);
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

  async save(): Promise<void> {
    this.message.set(null);
    this.loading.set(true);
    const name = this.fullName().trim();
    const file = this.avatarFile();
    const { error } = await this.auth.updateProfile({
      fullName: name || undefined,
      avatarFile: file ?? undefined,
    });
    this.loading.set(false);
    if (error) {
      this.message.set({ type: 'error', text: error.message ?? 'Failed to update profile' });
      return;
    }
    this.message.set({ type: 'success', text: 'Profile updated' });
    this.avatarFile.set(null);
  }
}
