import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const profileGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userId = authService.getUserId();

  if (userId) {
    router.navigate(['/profile', userId]);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
