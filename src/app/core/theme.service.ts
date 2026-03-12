import { Injectable } from '@angular/core';
import { Theme } from './enums';

export { Theme };

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor() {
    // Always dark — remove any stale stored preference
    document.documentElement.setAttribute('data-theme', Theme.Dark);
    try {
      localStorage.removeItem('75-hard-theme');
    } catch {
      /* ignore */
    }
  }
}
