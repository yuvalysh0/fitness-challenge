import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { AppRoute } from './enums';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitForSession();
  if (!auth.isAuthenticated()) return router.createUrlTree([AppRoute.Login]);
  const onOnboardingRoute = route.routeConfig?.path === 'onboarding';
  if (!auth.hasCompletedOnboarding() && !onOnboardingRoute)
    return router.createUrlTree([AppRoute.Onboarding]);
  if (auth.hasCompletedOnboarding() && onOnboardingRoute)
    return router.createUrlTree([AppRoute.Home]);
  return true;
};
