import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService, AVATARS_BUCKET } from './supabase.service';

export interface UserProfile {
  full_name: string | null;
  avatar_path: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly session = signal<Session | null>(null);
  private readonly sessionReady = Promise.resolve().then(() =>
    this.supabase.supabase.auth.getSession().then(({ data: { session } }) => {
      this.session.set(session);
    }),
  );
  private readonly profileState = signal<UserProfile | null>(null);

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.session()?.user);
  readonly profile = this.profileState.asReadonly();

  constructor() {
    this.supabase.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
    effect(() => {
      const u = this.user();
      if (!u) {
        this.profileState.set(null);
        return;
      }
      this.loadProfile(u.id);
    });
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .select('full_name, avatar_path')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) {
      this.profileState.set({ full_name: null, avatar_path: null });
      return;
    }
    if (this.user()?.id === userId) {
      this.profileState.set({
        full_name: (data as { full_name: string | null }).full_name ?? null,
        avatar_path: (data as { avatar_path: string | null }).avatar_path ?? null,
      });
    }
  }

  /** Resolves when initial session has been loaded (for guards). */
  async waitForSession(): Promise<void> {
    await this.sessionReady;
  }

  async signUp(
    email: string,
    password: string,
    options?: { fullName?: string; avatarFile?: File },
  ): Promise<{ error: Error | null }> {
    const {
      data: { user },
      error: signUpError,
    } = await this.supabase.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: options?.fullName?.trim() ?? '' },
      },
    });
    if (signUpError) return { error: signUpError };
    if (options?.avatarFile && user) {
      const ext = options.avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      await this.supabase.supabase.storage.from(AVATARS_BUCKET).upload(path, options.avatarFile, {
        upsert: true,
      });
      await this.supabase.supabase
        .from('profiles')
        .update({ avatar_path: path, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      await this.loadProfile(user.id);
    }
    return { error: null };
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  }

  async signOut(): Promise<void> {
    this.supabase.supabase.auth.signOut();
    this.session.set(null);
  }

  /** Display name for greeting: profile name, or email prefix, or fallback. */
  displayName(): string {
    const p = this.profileState();
    const u = this.user();
    if (p?.full_name?.trim()) return p.full_name.trim();
    if (u?.email) return u.email.split('@')[0] ?? 'there';
    return 'there';
  }

  /** Avatar image URL or null if none. */
  avatarUrl(): string | null {
    const p = this.profileState();
    if (!p?.avatar_path) return null;
    return this.supabase.getPublicAvatarUrl(p.avatar_path);
  }
}
