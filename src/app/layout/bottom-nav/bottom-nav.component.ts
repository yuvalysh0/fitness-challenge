import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppRoute } from '../../core/enums';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly router = inject(Router);

  protected readonly AppRoute = AppRoute;

  isActive(path: string): boolean {
    const url = this.router.url;
    if (path === AppRoute.Home) return url === AppRoute.Home || url === '';
    return url.startsWith(path);
  }
}
