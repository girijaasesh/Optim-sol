import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RegistrationService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
<div class="my-courses">
  <div class="page-header">
    <div>
      <h1>My Courses</h1>
      <p>Your registered sessions and course materials</p>
    </div>
    <a routerLink="/certifications" class="btn btn-primary">+ Register for Course</a>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" class="regs-grid">
    <div *ngFor="let s of [1,2,3]" class="reg-card skeleton"></div>
  </div>

  <!-- Upcoming -->
  <div *ngIf="!loading() && upcoming().length > 0">
    <div class="section-label">Upcoming Sessions</div>
    <div class="regs-grid">
      <div *ngFor="let r of upcoming()" class="reg-card" [class]="'status-' + r.status.toLowerCase()">
        <div class="rc-header">
          <span class="badge" [class]="statusBadge(r.status)">{{ r.status }}</span>
          <span class="rc-ref">{{ r.registrationRef }}</span>
        </div>
        <h3 class="rc-title">{{ r.course.title }}</h3>
        <div class="rc-meta">
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span>{{ r.course.startDate | date:'EEEE, d MMMM yyyy' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">⏱</span>
            <span>{{ r.course.durationDays }} days</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">{{ r.course.format === 'VIRTUAL' ? '💻' : '🏢' }}</span>
            <span>{{ r.course.format === 'VIRTUAL' ? 'Virtual' : r.course.venue || 'In-Person' }}</span>
          </div>
          <div class="meta-item" *ngIf="r.course.zoomLink && r.status === 'CONFIRMED'">
            <span class="meta-icon">🔗</span>
            <a [href]="r.course.zoomLink" target="_blank" class="link">Join Meeting</a>
          </div>
        </div>
        <div class="rc-footer">
          <div class="rc-price">
            <span>{{ r.amount | currency:r.currency }}</span>
            <span class="payment-badge" [class]="payBadge(r.paymentStatus)">{{ r.paymentStatus }}</span>
          </div>
          <div class="rc-actions">
            <a *ngIf="r.course.materialsLink" [href]="r.course.materialsLink" target="_blank" class="btn btn-outline btn-sm">
              📥 Pre-Work
            </a>
            <button *ngIf="r.paymentStatus === 'PENDING'" class="btn btn-primary btn-sm"
              (click)="completePayment(r)">
              💳 Complete Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Past / Completed -->
  <div *ngIf="!loading() && past().length > 0" style="margin-top:2rem">
    <div class="section-label">Past Courses</div>
    <div class="regs-grid">
      <div *ngFor="let r of past()" class="reg-card past-card">
        <div class="rc-header">
          <span class="badge badge-grey">{{ r.status }}</span>
          <span class="rc-ref">{{ r.registrationRef }}</span>
        </div>
        <h3 class="rc-title">{{ r.course.title }}</h3>
        <div class="rc-meta">
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span>{{ r.course.startDate | date:'d MMM yyyy' }}</span>
          </div>
        </div>
        <div class="rc-footer">
          <span>{{ r.amount | currency:r.currency }}</span>
          <a routerLink="/portal/certificates" class="btn btn-outline btn-sm">🏆 View Certificate</a>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div *ngIf="!loading() && regs().length === 0" class="empty-state">
    <div class="empty-icon">📚</div>
    <h2>No courses yet</h2>
    <p>Register for a SAFe® certification course to get started on your agile journey.</p>
    <a routerLink="/certifications" class="btn btn-primary">Browse Courses →</a>
  </div>
</div>
  `,
  styles: [`
.my-courses { max-width:900px; }
.page-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem; h1{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
.section-label { font-size:0.75rem;font-weight:700;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:1rem; }
.regs-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem;margin-bottom:2rem; }

.reg-card {
  background:white;border:1.5px solid var(--border);border-radius:14px;
  padding:1.5rem;display:flex;flex-direction:column;gap:1rem;
  transition:box-shadow 0.2s,transform 0.2s;
  &:hover { box-shadow:var(--shadow-sm);transform:translateY(-1px); }
  &.status-confirmed { border-color:rgba(45,122,74,0.3); }
  &.skeleton { min-height:220px;background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border:none; }
  &.past-card { opacity:0.75; }
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

.rc-header { display:flex;justify-content:space-between;align-items:center; }
.badge { display:inline-block;padding:3px 10px;border-radius:999px;font-size:0.68rem;font-weight:700; }
.badge-green { background:#dcfce7;color:#166534; }
.badge-yellow { background:#fef9c3;color:#854d0e; }
.badge-grey { background:#f3f4f6;color:#6b7280; }
.badge-red { background:#fee2e2;color:#991b1b; }
.rc-ref { font-size:0.7rem;color:var(--ink-light);font-family:'IBM Plex Mono',monospace; }
.rc-title { font-family:'Lora',serif;font-size:1.05rem;font-weight:700;color:var(--ink);line-height:1.3; }
.rc-meta { display:flex;flex-direction:column;gap:0.4rem; }
.meta-item { display:flex;align-items:center;gap:8px;font-size:0.8rem;color:var(--ink-mid); }
.meta-icon { font-size:0.9rem;width:18px;text-align:center;flex-shrink:0; }
.link { color:var(--teal);text-decoration:none;font-weight:600;&:hover{text-decoration:underline;} }
.rc-footer { display:flex;justify-content:space-between;align-items:center;padding-top:0.75rem;border-top:1px solid var(--border);flex-wrap:wrap;gap:0.5rem; }
.rc-price { display:flex;align-items:center;gap:0.5rem;font-weight:600;font-size:0.875rem; }
.payment-badge { font-size:0.65rem;padding:2px 7px;border-radius:999px;font-weight:700; }
.rc-actions { display:flex;gap:0.5rem;flex-wrap:wrap; }

.empty-state { text-align:center;padding:4rem 2rem; .empty-icon{font-size:3.5rem;margin-bottom:1rem;} h2{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;margin-bottom:0.5rem;} p{color:var(--ink-mid);max-width:380px;margin:0 auto 1.5rem;line-height:1.7;} }

.pay-PAID { background:#dcfce7;color:#166534; }
.pay-PENDING { background:#fef9c3;color:#854d0e; }
.pay-FAILED { background:#fee2e2;color:#991b1b; }
`]
})
export class MyCoursesComponent implements OnInit {
  private regService = inject(RegistrationService);
  auth = inject(AuthService);

  regs    = signal<any[]>([]);
  loading = signal(true);

  upcoming = computed(() => {
    const now = new Date();
    return this.regs().filter(r => {
      if (!r.course.startDate) return true;
      return new Date(r.course.startDate) >= now && r.status !== 'CANCELLED';
    });
  });

  past = computed(() => {
    const now = new Date();
    return this.regs().filter(r => {
      if (!r.course.startDate) return false;
      return new Date(r.course.startDate) < now || r.status === 'COMPLETED';
    });
  });

  ngOnInit() {
    this.regService.getMyRegistrations().subscribe({
      next: r => { this.regs.set(r.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  completePayment(r: any) {
    // In production: redirect to Stripe checkout session
    window.open(`/portal/payment?regId=${r.id}`, '_blank');
  }

  statusBadge(s: string): string {
    return { CONFIRMED:'badge-green', PENDING:'badge-yellow', WAITLISTED:'badge-grey', CANCELLED:'badge-red', COMPLETED:'badge-green' }[s] || 'badge-grey';
  }
  payBadge(s: string): string {
    return `pay-${s}`;
  }
}
