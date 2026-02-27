// src/app/core/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const token = authService.getAccessToken();
  const isApiRequest = req.url.includes('/api/') || req.url.startsWith('/api');

  // Skip adding token for public auth endpoints
  const isPublicEndpoint = req.url.includes('/auth/login') ||
                           req.url.includes('/auth/register') ||
                           req.url.includes('/auth/refresh') ||
                           req.url.includes('/courses/public') ||
                           req.url.includes('/certifications/public');

  let cloned = req;
  if (token && isApiRequest && !isPublicEndpoint) {
    cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isPublicEndpoint) {
        // Try to refresh token
        const refresh = authService.getRefreshToken();
        if (refresh && !req.url.includes('/auth/refresh')) {
          return authService.refreshToken().pipe(
            switchMap(res => {
              if (res.success && res.data?.accessToken) {
                const retried = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${res.data.accessToken}`)
                });
                return next(retried);
              }
              authService.logout();
              return throwError(() => err);
            }),
            catchError(() => {
              authService.logout();
              return throwError(() => err);
            })
          );
        }
        // No refresh token — redirect to login
        const isAdminRoute = router.url.startsWith('/admin');
        router.navigate([isAdminRoute ? '/admin/login' : '/login']);
      }
      return throwError(() => err);
    })
  );
};

// ─────────────────────────────────────────────
// src/app/core/guards/auth.guard.ts
// ─────────────────────────────────────────────
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    const token = auth.getAccessToken();
    if (token && !auth.isTokenExpired(token)) return true;
    auth.logout();
  }

  const isAdminRoute = state.url.startsWith('/admin');
  router.navigate([isAdminRoute ? '/admin/login' : '/login'],
    { queryParams: { returnUrl: state.url } });
  return false;
};

// ─────────────────────────────────────────────
// src/app/core/guards/admin.guard.ts
// ─────────────────────────────────────────────
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) return true;
  router.navigate(['/admin/login']);
  return false;
};

// ─────────────────────────────────────────────
// src/app/core/guards/no-auth.guard.ts
// ─────────────────────────────────────────────
export const noAuthGuard: CanActivateFn = (_, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;

  // Already logged in — redirect to appropriate portal
  if (auth.isAdmin()) router.navigate(['/admin']);
  else router.navigate(['/portal']);
  return false;
};
