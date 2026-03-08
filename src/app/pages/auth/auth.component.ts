import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isLogin = signal(true);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fullName: [''],
  });
  readonly avatarFile = signal<File | null>(null);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });
  }

  toggleMode(): void {
    this.isLogin.update((v) => !v);
    this.errorMessage.set(null);
    this.avatarFile.set(null);
    this.loginForm.reset({ email: '', password: '', fullName: '' });
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.avatarFile.set(file && file.type.startsWith('image/') ? file : null);
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    const { email, password, fullName } = this.loginForm.getRawValue();
    const { error } = this.isLogin()
      ? await this.auth.signIn(email, password)
      : await this.auth.signUp(email, password, {
          fullName: fullName?.trim() || undefined,
          avatarFile: this.avatarFile() ?? undefined,
        });
    this.loading.set(false);
    if (error) {
      this.errorMessage.set(error.message ?? 'Something went wrong');
      return;
    }
    this.router.navigate(['/']);
  }
}
