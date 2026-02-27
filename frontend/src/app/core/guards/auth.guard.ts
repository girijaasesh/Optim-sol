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
