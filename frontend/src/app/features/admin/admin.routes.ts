import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./courses/courses.component').then(m => m.CoursesComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent)
      },
      {
        path: 'registrations',
        loadComponent: () => import('./registrations/registrations.component').then(m => m.RegistrationsComponent)
      },
      {
        path: 'certificates',
        loadComponent: () => import('./certificates/certificates.component').then(m => m.CertificatesComponent)
      },
      {
        path: 'coupons',
        loadComponent: () => import('./coupons/coupons.component').then(m => m.CouponsComponent)
      },
      {
        path: 'waitlist',
        loadComponent: () => import('./waitlist/waitlist.component').then(m => m.WaitlistComponent)
      },
      {
        path: 'revenue',
        loadComponent: () => import('./revenue/revenue.component').then(m => m.RevenueComponent)
      },
      {
        path: 'corporate',
        loadComponent: () => import('./corporate/corporate.component').then(m => m.CorporateComponent)
      },
    ]
  }
];
