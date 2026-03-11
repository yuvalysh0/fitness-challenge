import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoute } from './enums';

export interface NavLink {
  path: string;
  label: string;
  icon: string;
}

export interface NavItem {
  path?: string;
  label: string;
  icon: string;
  children?: NavLink[];
}

const NAV_ITEMS: NavItem[] = [
  { path: AppRoute.Daily, label: 'Today', icon: 'today' },
  {
    label: 'Progress',
    icon: 'trending_up',
    children: [
      { path: AppRoute.Progress, label: 'Photos', icon: 'photo_library' },
      { path: AppRoute.Measurements, label: 'Measurements', icon: 'straighten' },
      { path: AppRoute.History, label: 'History', icon: 'calendar_today' },
    ],
  },
  { path: AppRoute.Habits, label: 'Tasks', icon: 'check_circle' },
  { path: AppRoute.Settings, label: 'Settings', icon: 'settings' },
];

@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly router = inject(Router);

  readonly items: readonly NavItem[] = NAV_ITEMS;

  isActive(path: string): boolean {
    const url = this.router.url;
    if (path === AppRoute.Home) return url === AppRoute.Home || url === '';
    return url.startsWith(path);
  }

  isGroupActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some((c) => this.isActive(c.path));
  }

  isLink(item: NavItem): item is NavItem & { path: string } {
    return 'path' in item && item.path != null && !item.children;
  }
}
