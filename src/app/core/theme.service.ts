import { Injectable, signal, computed, effect } from '@angular/core';
import { Theme } from './enums';

export { Theme };
/** Resolved theme applied to the document (excludes 'system'). */
export type EffectiveTheme = Theme.Dark | Theme.Light;

const STORAGE_KEY = '75-hard-theme';

function getStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return Theme.Dark;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === Theme.Dark || v === Theme.Light || v === Theme.System) return v;
  return Theme.Dark;
}

function resolveEffective(preference: Theme): EffectiveTheme {
  if (preference === Theme.System) {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches
      ? Theme.Light
      : Theme.Dark;
  }
  return preference as EffectiveTheme;
}

function applyToDocument(effective: EffectiveTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', effective);
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preference = signal<Theme>(getStoredTheme());

  readonly theme = this.preference.asReadonly();
  readonly effectiveTheme = computed(() => resolveEffective(this.preference()));

  constructor() {
    applyToDocument(resolveEffective(getStoredTheme()));
    effect(() => {
      applyToDocument(this.effectiveTheme());
    });
    if (typeof window !== 'undefined') {
      matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (this.preference() === Theme.System) {
          applyToDocument(resolveEffective(Theme.System));
        }
      });
    }
  }

  setTheme(value: Theme): void {
    this.preference.set(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }
}
