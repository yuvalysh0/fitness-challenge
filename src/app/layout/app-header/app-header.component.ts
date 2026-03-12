import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AppRoute } from '../../core/enums';

const ROUTE_TITLES: Record<string, string> = {
  [AppRoute.Home]: 'Home',
  [AppRoute.Daily]: 'Daily Log',
  [AppRoute.Progress]: 'Progress',
  [AppRoute.Measurements]: 'Measurements',
  [AppRoute.Habits]: 'Tasks',
  [AppRoute.History]: 'History',
  [AppRoute.Settings]: 'Settings',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  protected readonly AppRoute = AppRoute;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    return ROUTE_TITLES[url] ?? 'Forge';
  });

  readonly isHome = computed(() => this.currentUrl() === AppRoute.Home || this.currentUrl() === '');
}
