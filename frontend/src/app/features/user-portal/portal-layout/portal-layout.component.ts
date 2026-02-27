import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="portal-shell">
  <!-- SIDEBAR -->
  <aside class="sidebar" [class.mobile-open]="mobileOpen()">
    <div class="sb-top">
      <div class="sb-brand" routerLink="/">
        <div class="brand-mark">A</div>
        <span>AgilePro</span>
      </div>
      <button class="sb-mobile-close" (click)="mobileOpen.set(false)">✕</button>
    </div>

    <div class="sb-user">
      <div class="user-avatar">{{ initials() }}</div>
      <div class="user-info">
        <div class="user-name">{{ auth.currentUser()?.fullName }}</div>
        <div class="user-email">{{ auth.currentUser()?.email }}</div>
      </div>
    </div>

    <nav class="sb-nav">
      <div class="sb-section">My Learning</div>
      <a routerLink="/portal/my-courses"   routerLinkActive="active" class="sb-link" (click)="mobileOpen.set(false)">
        <span class="sb-icon">📚</span><span>My Courses</span>
      </a>
      <a routerLink="/portal/certificates" routerLinkActive="active" class="sb-link" (click)="mobileOpen.set(false)">
        <span class="sb-icon">🏆</span><span>Certificates</span>
      </a>
      <div class="sb-section">Account</div>
      <a routerLink="/portal/invoices"  routerLinkActive="active" class="sb-link" (click)="mobileOpen.set(false)">
        <span class="sb-icon">🧾</span><span>Invoices & Receipts</span>
      </a>
      <a routerLink="/portal/profile"  routerLinkActive="active" class="sb-link" (click)="mobileOpen.set(false)">
        <span class="sb-icon">👤</span><span>Profile</span>
      </a>
      <a routerLink="/portal/security" routerLinkActive="active" class="sb-link" (click)="mobileOpen.set(false)">
        <span class="sb-icon">🔒</span><span>Security & MFA</span>
      </a>
    </nav>

    <div class="sb-footer-links">
      <a routerLink="/certifications" class="sb-link-sm">Browse Courses</a>
      <button class="sb-link-sm text-red" (click)="logout()">Sign Out</button>
    </div>
  </aside>

  <!-- MOBILE OVERLAY -->
  <div class="mobile-overlay" *ngIf="mobileOpen()" (click)="mobileOpen.set(false)"></div>

  <!-- MAIN -->
  <main class="portal-main">
    <header class="portal-topbar">
      <button class="menu-btn" (click)="mobileOpen.set(true)">☰</button>
      <div class="topbar-right">
        <a routerLink="/certifications" class="topbar-link">Browse Courses</a>
        <div class="topbar-avatar" title="{{ auth.currentUser()?.fullName }}">{{ initials() }}</div>
      </div>
    </header>
    <div class="portal-content">
      <router-outlet />
    </div>
  </main>
</div>
  `,
  styles: [`
.portal-shell { display:flex;min-height:100vh;background:var(--cream); }

.sidebar {
  width:260px; background:white; border-right:1px solid var(--border);
  display:flex; flex-direction:column; position:sticky; top:0; height:100vh;
  flex-shrink:0; z-index:50; overflow-y:auto;
}

.sb-top { display:flex;align-items:center;justify-content:space-between;padding:1.5rem 1.25rem 1rem; }
.sb-brand { display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;color:var(--ink); }
.brand-mark { width:34px;height:34px;background:var(--amber);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Lora',serif;font-weight:700;color:white;font-size:0.9rem;flex-shrink:0; }
.sb-brand span { font-family:'Lora',serif;font-weight:700;font-size:1rem; }
.sb-mobile-close { display:none;background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--ink-mid); }

.sb-user { padding:1rem 1.25rem;border-bottom:1px solid var(--border);margin-bottom:0.5rem;display:flex;align-items:center;gap:12px; }
.user-avatar { width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--teal) 0%,#1a5c63 100%);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;color:white;flex-shrink:0; }
.user-name  { font-size:0.875rem;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.user-email { font-size:0.72rem;color:var(--ink-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.user-info  { min-width:0; }

.sb-nav { flex:1;padding:0 0 1rem; }
.sb-section { font-size:0.68rem;font-weight:700;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.08em;padding:1rem 1.25rem 0.4rem; }
.sb-link { display:flex;align-items:center;gap:10px;padding:0.6rem 1.25rem;text-decoration:none;color:var(--ink-mid);font-size:0.875rem;font-weight:500;transition:all 0.15s;border-right:3px solid transparent; }
.sb-link:hover { background:var(--cream);color:var(--ink); }
.sb-link.active { background:var(--teal-light);color:var(--teal);border-right-color:var(--teal); }
.sb-icon { font-size:1rem;width:20px;text-align:center;flex-shrink:0; }

.sb-footer-links { padding:1rem 1.25rem;border-top:1px solid var(--border);display:flex;gap:1rem; }
.sb-link-sm { background:none;border:none;font-size:0.78rem;color:var(--ink-light);cursor:pointer;padding:0;text-decoration:none;transition:color 0.15s; &:hover{color:var(--ink);} &.text-red{color:var(--red);} }

.portal-main { flex:1;display:flex;flex-direction:column;min-width:0; }
.portal-topbar { background:white;border-bottom:1px solid var(--border);padding:0.75rem 2rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40; }
.menu-btn { display:none;background:none;border:none;font-size:1.1rem;color:var(--ink-mid);cursor:pointer; }
.topbar-right { display:flex;align-items:center;gap:1.25rem; }
.topbar-link { font-size:0.8rem;color:var(--ink-mid);text-decoration:none;&:hover{color:var(--ink);} }
.topbar-avatar { width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--teal),#1a5c63);color:white;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;cursor:pointer; }
.portal-content { padding:2rem;flex:1; }

.mobile-overlay { display:none; }

@media (max-width:768px) {
  .sidebar { position:fixed;left:-260px;transition:left 0.25s;box-shadow:none; &.mobile-open{left:0;box-shadow:4px 0 20px rgba(0,0,0,0.15);} }
  .sb-mobile-close { display:block; }
  .menu-btn { display:block; }
  .mobile-overlay { display:block;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:45; }
  .portal-content { padding:1.25rem; }
}
`]
})
export class PortalLayoutComponent {
  auth      = inject(AuthService);
  router    = inject(Router);
  mobileOpen = signal(false);

  initials(): string {
    return this.auth.currentUser()?.fullName?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'ME';
  }
  logout() { this.auth.logout(); }
}
