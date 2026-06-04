import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const profileCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isProfileComplete()) return true;
  return router.createUrlTree(['/perfil/editar'], {
    queryParams: { reason: 'profile_incomplete' },
  });
};
