
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const staffGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const role = localStorage.getItem('role'); // expected 'STAFF'
  if (role === 'STAFF') {
    return true;
  }

  return router.createUrlTree(['/staff/login'], { queryParams: { returnUrl: state.url } });
};
