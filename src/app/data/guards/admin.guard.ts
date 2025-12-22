import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(GoogleAuthService);
  const router = inject(Router);

  if (authService.isAdminOrManager) {
    return true;
  }

  // Redirect to home if not authorized
  return router.parseUrl('/');
};
