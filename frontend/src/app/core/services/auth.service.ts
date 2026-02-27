// src/app/core/services/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import {
  ApiResponse, AuthResponse, LoginRequest, RegisterRequest,
  MfaVerifyRequest, UserProfile
} from '../models/auth.models';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private readonly API = `${environment.apiUrl}/auth`;
  private readonly ACCESS_TOKEN_KEY  = 'agilepro_access_token';
  private readonly REFRESH_TOKEN_KEY = 'agilepro_refresh_token';
  private readonly USER_KEY          = 'agilepro_user';

  // ── Reactive state (Angular 17 signals) ──────────────────────
  currentUser   = signal<UserProfile | null>(this.loadStoredUser());
  isLoggedIn    = computed(() => this.currentUser() !== null);
  isAdmin       = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });

  // ── Login (email + password) ──────────────────────────────────
  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/login`, req)
      .pipe(tap(res => { if (res.success && res.data && !res.data.mfaRequired) this.storeSession(res.data); }));
  }

  // ── Admin Login ───────────────────────────────────────────────
  adminLogin(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/admin/login`, req)
      .pipe(tap(res => { if (res.success && res.data && !res.data.mfaRequired) this.storeSession(res.data); }));
  }

  // ── MFA Verify ────────────────────────────────────────────────
  verifyMfa(req: MfaVerifyRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/mfa/verify`, req)
      .pipe(tap(res => { if (res.success && res.data) this.storeSession(res.data); }));
  }

  // ── Backup Code ───────────────────────────────────────────────
  verifyBackupCode(mfaToken: string, code: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/mfa/backup`, { mfaToken, backupCode: code })
      .pipe(tap(res => { if (res.success && res.data) this.storeSession(res.data); }));
  }

  // ── Register ──────────────────────────────────────────────────
  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/register`, req);
  }

  // ── Google OAuth — initiate flow ──────────────────────────────
  initiateGoogleLogin(): void {
    // Redirect browser to Spring Boot OAuth2 endpoint
    window.location.href = `${environment.apiUrl}/auth/oauth2/authorize/google`;
  }

  // ── OAuth Callback — process token from URL fragment ─────────
  handleOAuthCallback(): void {
    const fragment = window.location.hash.substring(1);
    const params   = new URLSearchParams(fragment);
    const access   = params.get('access_token');
    const refresh  = params.get('refresh_token');

    if (access && refresh) {
      const decoded: any = jwtDecode(access);
      const user: UserProfile = {
        id:               decoded.userId,
        fullName:         decoded.fullName,
        email:            decoded.sub,
        role:             decoded.role,
        provider:         'GOOGLE',
        emailVerified:    true,
        mfaEnabled:       false,
        preferredCurrency: 'USD'
      };
      this.storeSession({ accessToken: access, refreshToken: refresh, tokenType: 'Bearer', mfaRequired: false, user });
      this.router.navigate([user.role === 'USER' ? '/portal' : '/admin']);
    }
  }

  // ── Forgot Password ───────────────────────────────────────────
  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/forgot-password`, { email });
  }

  // ── Reset Password ────────────────────────────────────────────
  resetPassword(token: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/reset-password`, { token, newPassword });
  }

  // ── Verify Email ──────────────────────────────────────────────
  verifyEmail(token: string): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(`${this.API}/verify-email?token=${token}`);
  }

  // ── Refresh Token ─────────────────────────────────────────────
  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refresh = this.getRefreshToken();
    if (!refresh) return throwError(() => new Error('No refresh token'));
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/refresh`, { refreshToken: refresh })
      .pipe(tap(res => { if (res.success && res.data) this.storeSession(res.data); }));
  }

  // ── Logout ────────────────────────────────────────────────────
  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http.post(`${this.API}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  adminLogout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http.post(`${this.API}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/admin/login']);
  }

  // ── MFA Setup ─────────────────────────────────────────────────
  setupMfa(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/mfa/setup`, {});
  }

  enableMfa(mfaToken: string, code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/mfa/enable`, { mfaToken, code });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY) ||
           localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch { return true; }
  }

  private storeSession(auth: AuthResponse): void {
    if (!auth.accessToken) return;
    // Store access token — sessionStorage by default (cleared on tab close)
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, auth.accessToken);
    if (auth.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, auth.refreshToken);
    }
    if (auth.user) {
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(auth.user));
      this.currentUser.set(auth.user);
    }
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUser.set(null);
  }

  private loadStoredUser(): UserProfile | null {
    try {
      const stored = sessionStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }
}
