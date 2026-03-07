import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'daily',
        loadComponent: () =>
          import('./pages/daily-log/daily-log.component').then((m) => m.DailyLogComponent),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./pages/progress-photos/progress-photos.component').then(
            (m) => m.ProgressPhotosComponent,
          ),
      },
      {
        path: 'measurements',
        loadComponent: () =>
          import('./pages/measurements/measurements.component').then(
            (m) => m.MeasurementsComponent,
          ),
      },
      {
        path: 'habits',
        loadComponent: () =>
          import('./pages/habits/habits.component').then((m) => m.HabitsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
