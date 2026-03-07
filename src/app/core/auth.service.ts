import { Injectable, signal, computed } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<Session | null>(null);
  private readonly sessionReady = Promise.resolve().then(() =>
    this.supabase.supabase.auth.getSession().then(({ data: { session } }) => {
      this.session.set(session);
    }),
  );

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.session()?.user);

  constructor(private readonly supabase: SupabaseService) {
    this.supabase.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
  }

  /** Resolves when initial session has been loaded (for guards). */
  async waitForSession(): Promise<void> {
    await this.sessionReady;
  }

  async signUp(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.supabase.auth.signUp({ email, password });
    return { error: error ?? null };
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  }

  async signOut(): Promise<void> {
    await this.supabase.supabase.auth.signOut();
    this.session.set(null);
  }
}
