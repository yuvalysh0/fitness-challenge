import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemePreference = 'dark' | 'light' | 'system';
export type EffectiveTheme = 'dark' | 'light';

const STORAGE_KEY = '75-hard-theme';

function getStoredTheme(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'dark';
  const v = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
  return v === 'dark' || v === 'light' || v === 'system' ? v : 'dark';
}

function resolveEffective(preference: ThemePreference): EffectiveTheme {
  if (preference === 'system') {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  return preference;
}

function applyToDocument(effective: EffectiveTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', effective);
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preference = signal<ThemePreference>(getStoredTheme());

  readonly theme = this.preference.asReadonly();
  readonly effectiveTheme = computed(() => resolveEffective(this.preference()));

  constructor() {
    applyToDocument(resolveEffective(getStoredTheme()));
    effect(() => {
      const eff = this.effectiveTheme();
      applyToDocument(eff);
    });
    if (typeof window !== 'undefined') {
      matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (this.preference() === 'system') {
          applyToDocument(resolveEffective('system'));
        }
      });
    }
  }

  setTheme(value: ThemePreference): void {
    this.preference.set(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }
}
