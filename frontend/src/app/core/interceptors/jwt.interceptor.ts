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
        const isAdminRoute = router.url.startsWith('/admin');
        router.navigate([isAdminRoute ? '/admin/login' : '/login']);
      }
      return throwError(() => err);
    })
  );
};
