import { Routes } from '@angular/router';
import { PortalLayoutComponent } from './portal-layout/portal-layout.component';

export const userPortalRoutes: Routes = [
  {
    path: '',
    component: PortalLayoutComponent,
    children: [
      { path: '', redirectTo: 'my-courses', pathMatch: 'full' },
      {
        path: 'my-courses',
        loadComponent: () => import('./my-courses/my-courses.component').then(m => m.MyCoursesComponent)
      },
      {
        path: 'certificates',
        loadComponent: () => import('./my-certificates/my-certificates.component').then(m => m.MyCertificatesComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./security/security.component').then(m => m.SecurityComponent)
      },
    ]
  }
];
