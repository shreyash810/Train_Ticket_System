
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Skip attaching token for public auth endpoints
  const isAuthEndpoint =
    req.url.includes('/api/passenger/login') ||
    req.url.includes('/api/passenger/register') ||
    req.url.includes('/api/admin/login') ||  // reserved for future
    req.url.includes('/api/staff/login');    // reserved for future

  if (!token || isAuthEndpoint) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true, // future-proof: if you move to httpOnly cookies later
  });

  return next(cloned);
};
