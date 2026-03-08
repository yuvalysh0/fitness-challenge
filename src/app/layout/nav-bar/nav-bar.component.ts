import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/daily', label: 'Today', icon: 'today' },
  { path: '/progress', label: 'Progress', icon: 'photo_library' },
  { path: '/measurements', label: 'Measurements', icon: 'straighten' },
  { path: '/habits', label: 'Tasks', icon: 'check_circle' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly items = NAV_ITEMS;
  readonly menuOpen = signal(false);

  isActive(path: string): boolean {
    const url = this.router.url;
    if (path === '/') return url === '/' || url === '';
    return url.startsWith(path);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async signOut(): Promise<void> {
    this.closeMenu();
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
