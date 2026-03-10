import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NavService, type NavItem } from '../../core/nav.service';

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
  readonly nav = inject(NavService);

  readonly items = this.nav.items;
  readonly menuOpen = signal(false);
  readonly openGroup = signal<string | null>(null);

  isActive(path: string): boolean {
    return this.nav.isActive(path);
  }

  isGroupActive(item: NavItem): boolean {
    return this.nav.isGroupActive(item);
  }

  isGroupOpen(item: NavItem): boolean {
    return this.openGroup() === item.label;
  }

  toggleGroup(item: NavItem): void {
    this.openGroup.update((current) => (current === item.label ? null : item.label));
  }

  isLink(item: NavItem): item is NavItem & { path: string } {
    return this.nav.isLink(item);
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
