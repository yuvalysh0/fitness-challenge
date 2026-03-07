import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'daily', loadComponent: () => import('./pages/daily-log/daily-log.component').then((m) => m.DailyLogComponent) },
      { path: 'measurements', loadComponent: () => import('./pages/measurements/measurements.component').then((m) => m.MeasurementsComponent) },
      { path: 'habits', loadComponent: () => import('./pages/habits/habits.component').then((m) => m.HabitsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
