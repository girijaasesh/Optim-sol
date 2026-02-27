// src/app/core/services/course.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, CourseDto } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/courses`;

  getPublicCourses(type?: string, currency = 'USD'): Observable<ApiResponse<CourseDto[]>> {
    let params = new HttpParams().set('currency', currency);
    if (type) params = params.set('type', type);
    return this.http.get<ApiResponse<CourseDto[]>>(`${this.base}/public`, { params });
  }

  getCourse(id: number, currency = 'USD'): Observable<ApiResponse<CourseDto>> {
    return this.http.get<ApiResponse<CourseDto>>(`${this.base}/public/${id}`, {
      params: new HttpParams().set('currency', currency)
    });
  }

  // Admin operations
  createCourse(req: any): Observable<ApiResponse<CourseDto>> {
    return this.http.post<ApiResponse<CourseDto>>(this.base, req);
  }

  updateCourse(id: number, req: any): Observable<ApiResponse<CourseDto>> {
    return this.http.put<ApiResponse<CourseDto>>(`${this.base}/${id}`, req);
  }

  deleteCourse(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  duplicateCourse(id: number): Observable<ApiResponse<CourseDto>> {
    return this.http.post<ApiResponse<CourseDto>>(`${this.base}/${id}/duplicate`, {});
  }
}

// ─────────────────────────────────────────────
// src/app/core/services/registration.service.ts
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/registrations`;

  createRegistration(req: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.base, req);
  }

  getMyRegistrations(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/my`);
  }

  createPaymentIntent(req: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/payment/create-intent`, req);
  }

  validateCoupon(code: string, courseId: number, currency = 'USD'): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('code', code).set('courseId', courseId.toString()).set('currency', currency);
    return this.http.get<ApiResponse<any>>(`${this.base}/validate-coupon`, { params });
  }
}

// ─────────────────────────────────────────────
// src/app/core/services/admin.service.ts
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/dashboard`);
  }

  getAllRegistrations(filters?: any): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (filters?.status)   params = params.set('status', filters.status);
    if (filters?.courseId) params = params.set('courseId', filters.courseId);
    if (filters?.search)   params = params.set('search', filters.search);
    return this.http.get<ApiResponse<any>>(`${this.base}/registrations`, { params });
  }

  createCoupon(req: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/coupons`, req);
  }

  issueCertificate(registrationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/certificates/issue/${registrationId}`, {});
  }

  exportCsv(courseId?: number): Observable<Blob> {
    let params = new HttpParams();
    if (courseId) params = params.set('courseId', courseId.toString());
    return this.http.get(`${this.base}/registrations/export`, { params, responseType: 'blob' });
  }
}

// Need these imports at top
import { HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';

// ─────────────────────────────────────────────
// src/app/features/admin/admin.routes.ts
// ─────────────────────────────────────────────
import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',      loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'courses',        loadComponent: () => import('./courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'schedule',       loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent) },
      { path: 'registrations',  loadComponent: () => import('./registrations/registrations.component').then(m => m.RegistrationsComponent) },
      { path: 'corporate',      loadComponent: () => import('./corporate/corporate.component').then(m => m.CorporateComponent) },
      { path: 'waitlist',       loadComponent: () => import('./waitlist/waitlist.component').then(m => m.WaitlistComponent) },
      { path: 'certificates',   loadComponent: () => import('./certificates/certificates.component').then(m => m.CertificatesComponent) },
      { path: 'coupons',        loadComponent: () => import('./coupons/coupons.component').then(m => m.CouponsComponent) },
      { path: 'revenue',        loadComponent: () => import('./revenue/revenue.component').then(m => m.RevenueComponent) },
      { path: 'currency',       loadComponent: () => import('./currency/currency.component').then(m => m.CurrencyComponent) },
      { path: 'lms',            loadComponent: () => import('./lms/lms.component').then(m => m.LmsComponent) },
      { path: 'seo',            loadComponent: () => import('./seo/seo.component').then(m => m.SeoComponent) },
      { path: 'content',        loadComponent: () => import('./content/content.component').then(m => m.ContentComponent) },
    ]
  }
];

// ─────────────────────────────────────────────
// src/app/features/user-portal/user-portal.routes.ts
// ─────────────────────────────────────────────
export const userPortalRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./portal-layout/portal-layout.component').then(m => m.PortalLayoutComponent),
    children: [
      { path: '', redirectTo: 'my-courses', pathMatch: 'full' },
      { path: 'my-courses',    loadComponent: () => import('./my-courses/my-courses.component').then(m => m.MyCoursesComponent) },
      { path: 'certificates',  loadComponent: () => import('./my-certificates/my-certificates.component').then(m => m.MyCertificatesComponent) },
      { path: 'invoices',      loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent) },
      { path: 'profile',       loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'security',      loadComponent: () => import('./security/security.component').then(m => m.SecurityComponent) },
    ]
  }
];

// ─────────────────────────────────────────────
// src/app/features/auth/oauth-callback/oauth-callback.component.ts
// ─────────────────────────────────────────────
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#666">
    <div style="text-align:center"><div style="font-size:2rem;margin-bottom:1rem">⏳</div><p>Completing sign in…</p></div>
  </div>`
})
export class OAuthCallbackComponent implements OnInit {
  private auth = inject(AuthService);
  ngOnInit(): void { this.auth.handleOAuthCallback(); }
}
