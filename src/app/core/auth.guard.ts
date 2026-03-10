import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitForSession();
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  const onOnboardingRoute = route.routeConfig?.path === 'onboarding';
  if (!auth.hasCompletedOnboarding() && !onOnboardingRoute)
    return router.createUrlTree(['/onboarding']);
  if (auth.hasCompletedOnboarding() && onOnboardingRoute) return router.createUrlTree(['/']);
  return true;
};
