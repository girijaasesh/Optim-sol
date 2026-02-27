import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="admin-shell">
  <aside class="sidebar" [class.collapsed]="collapsed()">
    <div class="sb-brand">
      <div class="brand-mark">A</div>
      <span class="brand-name">AgilePro</span>
    </div>
    <nav class="sb-nav">
      <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="active" class="sb-link" [title]="item.label">
        <span class="sb-icon">{{ item.icon }}</span>
        <span class="sb-label">{{ item.label }}</span>
      </a>
    </nav>
    <div class="sb-footer">
      <div class="sb-user">
        <div class="user-avatar">{{ initials() }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.currentUser()?.fullName }}</div>
          <div class="user-role">{{ auth.currentUser()?.role }}</div>
        </div>
      </div>
      <button class="sb-logout" (click)="logout()" title="Sign out">⏻</button>
    </div>
  </aside>
  <main class="admin-main">
    <header class="admin-topbar">
      <button class="menu-btn" (click)="collapsed.set(!collapsed())">☰</button>
      <a routerLink="/" class="topbar-link">← View Site</a>
    </header>
    <div class="admin-content"><router-outlet /></div>
  </main>
</div>`,
  styles: [`
.admin-shell{display:flex;min-height:100vh;background:#f5f4f0;}
.sidebar{width:240px;background:var(--ink);display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;z-index:50;transition:width 0.25s;&.collapsed{width:64px;.brand-name,.sb-label,.user-info{display:none;}}}
.sb-brand{display:flex;align-items:center;gap:10px;padding:1.5rem 1.25rem 1rem;}
.brand-mark{width:36px;height:36px;background:var(--amber);border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Lora',serif;font-weight:700;color:white;font-size:1rem;flex-shrink:0;}
.brand-name{font-family:'Lora',serif;font-weight:700;color:white;font-size:1rem;white-space:nowrap;}
.sb-nav{flex:1;padding:0.5rem 0;overflow-y:auto;}
.sb-link{display:flex;align-items:center;gap:12px;padding:0.65rem 1.25rem;text-decoration:none;color:rgba(255,255,255,0.5);font-size:0.875rem;font-weight:500;transition:all 0.15s;&:hover{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.9);}&.active{background:rgba(255,255,255,0.1);color:white;border-right:3px solid var(--amber);}}
.sb-icon{font-size:1rem;width:20px;text-align:center;flex-shrink:0;}
.sb-footer{padding:1rem 1.25rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:8px;}
.sb-user{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
.user-avatar{width:34px;height:34px;border-radius:50%;background:var(--amber);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:var(--ink);flex-shrink:0;}
.user-name{font-size:0.8rem;font-weight:600;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.user-role{font-size:0.68rem;color:rgba(255,255,255,0.35);}
.sb-logout{background:none;border:none;color:rgba(255,255,255,0.3);font-size:1rem;padding:4px;cursor:pointer;&:hover{color:white;}}
.admin-main{flex:1;display:flex;flex-direction:column;min-width:0;}
.admin-topbar{background:white;border-bottom:1px solid var(--border);padding:0.75rem 2rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
.menu-btn{background:none;border:none;font-size:1.1rem;color:var(--ink-mid);cursor:pointer;}
.topbar-link{font-size:0.8rem;color:var(--ink-mid);text-decoration:none;&:hover{color:var(--ink);}}
.admin-content{padding:2rem;flex:1;}
`]
})
export class AdminLayoutComponent {
  auth   = inject(AuthService);
  router = inject(Router);
  collapsed = signal(false);

  navItems = [
    {path:'/admin/dashboard',icon:'📊',label:'Dashboard'},
    {path:'/admin/courses',icon:'📚',label:'Courses'},
    {path:'/admin/schedule',icon:'📅',label:'Schedule'},
    {path:'/admin/registrations',icon:'📋',label:'Registrations'},
    {path:'/admin/corporate',icon:'🏢',label:'Corporate'},
    {path:'/admin/waitlist',icon:'⏳',label:'Waitlist'},
    {path:'/admin/certificates',icon:'🏆',label:'Certificates'},
    {path:'/admin/coupons',icon:'🏷',label:'Coupons'},
    {path:'/admin/revenue',icon:'💰',label:'Revenue'},
  ];

  initials() {
    return this.auth.currentUser()?.fullName?.split(' ').map(n=>n[0]).join('').slice(0,2)||'AD';
  }
  logout() { this.auth.adminLogout(); }
}
