import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

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
  { path: '/daily', label: 'Today', icon: 'today' },
  {
    label: 'Progress',
    icon: 'trending_up',
    children: [
      { path: '/progress', label: 'Photos', icon: 'photo_library' },
      { path: '/measurements', label: 'Measurements', icon: 'straighten' },
      { path: '/history', label: 'History', icon: 'calendar_today' },
    ],
  },
  { path: '/habits', label: 'Tasks', icon: 'check_circle' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly router = inject(Router);

  readonly items: readonly NavItem[] = NAV_ITEMS;

  isActive(path: string): boolean {
    const url = this.router.url;
    if (path === '/') return url === '/' || url === '';
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
