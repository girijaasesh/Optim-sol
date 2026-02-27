import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/services';
import { DashboardStats } from '../../../core/models/auth.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, RouterLink],
  template: `
<div class="dashboard">
  <div class="page-header">
    <h1>Dashboard</h1>
    <p>Overview of your training business</p>
  </div>

  <!-- KPI CARDS -->
  <div class="kpi-grid" *ngIf="!loading()">
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#f0fdf4;color:var(--green)">💰</div>
      <div class="kpi-body">
        <div class="kpi-label">Revenue YTD</div>
        <div class="kpi-value">{{ (stats()?.revenueYtd || 0) | currency:'USD':'symbol':'1.0-0' }}</div>
        <div class="kpi-sub">This month: {{ (stats()?.revenueThisMonth || 0) | currency:'USD':'symbol':'1.0-0' }}</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:var(--teal-light);color:var(--teal)">📋</div>
      <div class="kpi-body">
        <div class="kpi-label">Total Registrations</div>
        <div class="kpi-value">{{ stats()?.totalRegistrations | number }}</div>
        <div class="kpi-sub">All time</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#fffbeb;color:#92400e">📅</div>
      <div class="kpi-body">
        <div class="kpi-label">Upcoming Courses</div>
        <div class="kpi-value">{{ stats()?.upcomingCourses }}</div>
        <div class="kpi-sub"><a routerLink="/admin/schedule">View schedule →</a></div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#fef2f2;color:var(--red)">⏳</div>
      <div class="kpi-body">
        <div class="kpi-label">On Waitlist</div>
        <div class="kpi-value">{{ stats()?.waitlistTotal }}</div>
        <div class="kpi-sub"><a routerLink="/admin/waitlist">Manage →</a></div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#f0fdf4;color:var(--green)">🏆</div>
      <div class="kpi-body">
        <div class="kpi-label">Certificates Issued</div>
        <div class="kpi-value">{{ stats()?.certificatesIssued | number }}</div>
        <div class="kpi-sub"><a routerLink="/admin/certificates">Issue new →</a></div>
      </div>
    </div>
  </div>

  <!-- LOADING SKELETON -->
  <div class="kpi-grid" *ngIf="loading()">
    <div *ngFor="let s of [1,2,3,4,5]" class="kpi-card skeleton" style="height:100px"></div>
  </div>

  <!-- REVENUE CHART -->
  <div class="section-row">
    <div class="card chart-card">
      <div class="card-header"><h3>Revenue by Month</h3></div>
      <div class="chart-body" *ngIf="stats()?.monthlyRevenue?.length">
        <div class="bar-chart">
          <div *ngFor="let m of stats()!.monthlyRevenue" class="bar-col">
            <div class="bar-label-top">{{ m.revenue | currency:'USD':'symbol':'1.0-0' }}</div>
            <div class="bar-wrap">
              <div class="bar-fill" [style.height.%]="getBarHeight(m.revenue)"></div>
            </div>
            <div class="bar-label-bot">{{ m.month }}</div>
          </div>
        </div>
      </div>
      <div class="empty-state" *ngIf="!stats()?.monthlyRevenue?.length" style="padding:2rem">
        <div class="empty-icon">📊</div><p>No revenue data yet</p>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="quick-actions card">
      <div class="card-header"><h3>Quick Actions</h3></div>
      <div class="qa-list">
        <a routerLink="/admin/courses" class="qa-item">
          <span class="qa-icon">➕</span>
          <div><div class="qa-title">Add New Course</div><div class="qa-sub">Create a new session</div></div>
        </a>
        <a routerLink="/admin/registrations" class="qa-item">
          <span class="qa-icon">📋</span>
          <div><div class="qa-title">View Registrations</div><div class="qa-sub">Manage sign-ups</div></div>
        </a>
        <a routerLink="/admin/certificates" class="qa-item">
          <span class="qa-icon">🏆</span>
          <div><div class="qa-title">Issue Certificates</div><div class="qa-sub">Send to completions</div></div>
        </a>
        <a routerLink="/admin/coupons" class="qa-item">
          <span class="qa-icon">🏷</span>
          <div><div class="qa-title">Create Coupon</div><div class="qa-sub">Early bird & promo codes</div></div>
        </a>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.dashboard { max-width:1200px; }
.kpi-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:2rem; }
.kpi-card { background:white;border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;display:flex;align-items:flex-start;gap:1rem;transition:box-shadow 0.2s;&:hover{box-shadow:var(--shadow-sm);} }
.kpi-card.skeleton { background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border:none; }
@keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
.kpi-icon { width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0; }
.kpi-label { font-size:0.72rem;font-weight:600;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px; }
.kpi-value { font-size:1.6rem;font-weight:700;font-family:'Lora',serif;color:var(--ink);line-height:1; }
.kpi-sub { font-size:0.72rem;color:var(--ink-light);margin-top:4px; a{color:var(--teal);text-decoration:none;} }

.section-row { display:grid;grid-template-columns:1fr 300px;gap:1.5rem;margin-top:0; }
.card { background:white;border:1px solid var(--border);border-radius:var(--radius); }
.card-header { padding:1.25rem 1.5rem;border-bottom:1px solid var(--border); h3{font-family:'Lora',serif;font-size:1rem;font-weight:700;} }
.chart-card { min-height:300px; }
.chart-body { padding:1.5rem; }

.bar-chart { display:flex;align-items:flex-end;gap:8px;height:180px; }
.bar-col { flex:1;display:flex;flex-direction:column;align-items:center;gap:4px; }
.bar-label-top { font-size:0.6rem;color:var(--ink-light);white-space:nowrap;transform:rotate(-45deg);margin-bottom:4px; }
.bar-wrap { flex:1;width:100%;background:var(--cream-mid);border-radius:4px 4px 0 0;display:flex;align-items:flex-end;min-height:20px; }
.bar-fill { width:100%;background:var(--teal);border-radius:4px 4px 0 0;transition:height 0.5s ease; }
.bar-label-bot { font-size:0.6rem;color:var(--ink-light);text-align:center; }

.qa-list { padding:0.5rem 0; }
.qa-item { display:flex;align-items:center;gap:12px;padding:0.85rem 1.5rem;text-decoration:none;color:var(--ink);transition:background 0.15s;&:hover{background:var(--cream);} }
.qa-icon { font-size:1.25rem;width:36px;height:36px;background:var(--cream);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.qa-title { font-size:0.875rem;font-weight:600;color:var(--ink);margin-bottom:2px; }
.qa-sub { font-size:0.75rem;color:var(--ink-mid); }

@media(max-width:900px){.section-row{grid-template-columns:1fr;}}
`]
})
export class DashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  stats   = signal<DashboardStats | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.adminService.getDashboardStats().subscribe({
      next: res => { this.stats.set(res.data || null); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  getBarHeight(revenue: number): number {
    const max = Math.max(...(this.stats()?.monthlyRevenue?.map(m => m.revenue) || [1]));
    return max > 0 ? (revenue / max) * 100 : 0;
  }
}
