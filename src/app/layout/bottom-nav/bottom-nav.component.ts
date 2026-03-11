import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppRoute } from '../../core/enums';

interface BottomNavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { path: AppRoute.Home, label: 'Home', icon: 'home' },
  { path: AppRoute.Daily, label: 'Today', icon: 'today' },
  { path: AppRoute.Progress, label: 'Progress', icon: 'trending_up' },
  { path: AppRoute.Habits, label: 'Tasks', icon: 'check_circle' },
  { path: AppRoute.Settings, label: 'Settings', icon: 'settings' },
];

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly router = inject(Router);

  readonly items = BOTTOM_NAV_ITEMS;

  isActive(path: string): boolean {
    const url = this.router.url;
    if (path === AppRoute.Home) return url === AppRoute.Home || url === '';
    return url.startsWith(path);
  }
}
