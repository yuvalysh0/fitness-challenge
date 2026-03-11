import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService, AVATARS_BUCKET } from './supabase.service';
import { ActivityLevel, Sex, DbTable } from './enums';

export { ActivityLevel, Sex };

export interface UserProfile {
  full_name: string | null;
  avatar_path: string | null;
  birth_date: string | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal_weight_kg: number | null;
  onboarding_completed_at: string | null;
}

export interface OnboardingData {
  birthDate: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalWeightKg?: number;
  programEndDate: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly session = signal<Session | null>(null);
  private readonly sessionReady = Promise.resolve().then(() =>
    this.supabase.supabase.auth.getSession().then(async ({ data: { session } }) => {
      this.session.set(session);
      if (session?.user?.id) {
        await this.loadProfile(session.user.id);
      }
    }),
  );
  private readonly profileState = signal<UserProfile | null>(null);

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.session()?.user);
  readonly profile = this.profileState.asReadonly();
  readonly hasCompletedOnboarding = computed(() => !!this.profileState()?.onboarding_completed_at);

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
      .from(DbTable.Profiles)
      .select(
        'full_name, avatar_path, birth_date, sex, height_cm, weight_kg, activity_level, goal_weight_kg, onboarding_completed_at',
      )
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) {
      this.profileState.set(emptyProfile());
      return;
    }
    const row = data as Record<string, unknown>;
    if (this.user()?.id === userId) {
      this.profileState.set({
        full_name: (row['full_name'] as string | null) ?? null,
        avatar_path: (row['avatar_path'] as string | null) ?? null,
        birth_date: (row['birth_date'] as string | null) ?? null,
        sex: (row['sex'] as UserProfile['sex']) ?? null,
        height_cm: (row['height_cm'] as number | null) ?? null,
        weight_kg: (row['weight_kg'] as number | null) ?? null,
        activity_level: (row['activity_level'] as ActivityLevel | null) ?? null,
        goal_weight_kg: (row['goal_weight_kg'] as number | null) ?? null,
        onboarding_completed_at: (row['onboarding_completed_at'] as string | null) ?? null,
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
        .from(DbTable.Profiles)
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

  /**
   * Updates the current user's profile (display name and/or avatar).
   * Call after signup or from a settings page.
   */
  async updateProfile(options: {
    fullName?: string;
    avatarFile?: File;
    birthDate?: string;
    goalWeightKg?: number | null;
  }): Promise<{ error: Error | null }> {
    const userId = this.user()?.id;
    if (!userId) return { error: new Error('Not authenticated') };

    const sb = this.supabase.supabase;

    if (options.avatarFile != null) {
      const ext = options.avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await sb.storage
        .from(AVATARS_BUCKET)
        .upload(path, options.avatarFile, { upsert: true });
      if (uploadError) return { error: uploadError };
      await sb
        .from(DbTable.Profiles)
        .update({ avatar_path: path, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (options.fullName !== undefined) profileUpdates['full_name'] = options.fullName.trim();
    if (options.birthDate !== undefined) profileUpdates['birth_date'] = options.birthDate || null;
    if (options.goalWeightKg !== undefined) profileUpdates['goal_weight_kg'] = options.goalWeightKg;

    if (Object.keys(profileUpdates).length > 1) {
      const { error: updateError } = await sb
        .from(DbTable.Profiles)
        .update(profileUpdates)
        .eq('id', userId);
      if (updateError) return { error: updateError };
    }

    await this.loadProfile(userId);
    return { error: null };
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

  /**
   * Saves onboarding data (TDEE + goal + program end date) and marks onboarding complete.
   * Call after the user finishes the onboarding wizard. Does not set challenge start/end;
   * the onboarding component should call ChallengeService.setStartAndEndDate after this.
   */
  async completeOnboarding(data: OnboardingData): Promise<{ error: Error | null }> {
    const userId = this.user()?.id;
    if (!userId) return { error: new Error('Not authenticated') };

    const { error } = await this.supabase.supabase
      .from(DbTable.Profiles)
      .update({
        birth_date: data.birthDate,
        sex: data.sex,
        height_cm: data.heightCm,
        weight_kg: data.weightKg,
        activity_level: data.activityLevel,
        goal_weight_kg: data.goalWeightKg ?? null,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) return { error };
    await this.loadProfile(userId);
    return { error: null };
  }

  /**
   * Clears onboarding status so the user is redirected to the onboarding wizard
   * on next navigation. Call when resetting the challenge.
   */
  async resetOnboarding(): Promise<void> {
    const userId = this.user()?.id;
    if (!userId) return;

    await this.supabase.supabase
      .from(DbTable.Profiles)
      .update({ onboarding_completed_at: null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    await this.loadProfile(userId);
  }
}

function emptyProfile(): UserProfile {
  return {
    full_name: null,
    avatar_path: null,
    birth_date: null,
    sex: null,
    height_cm: null,
    weight_kg: null,
    activity_level: null,
    goal_weight_kg: null,
    onboarding_completed_at: null,
  };
}
