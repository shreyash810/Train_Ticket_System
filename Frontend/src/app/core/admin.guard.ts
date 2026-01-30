
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // 🔐 TEMP strategy (UI-only): read role stored after login
  const role = localStorage.getItem('role'); // expected 'ADMIN' | 'STAFF' | 'PASSENGER'
  if (role === 'ADMIN') {
    return true;
  }

  // Not admin → send to admin login, preserve the original URL
  return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};
