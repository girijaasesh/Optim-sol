import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, RegistrationService } from '../../../core/services/services';

@Component({
  selector: 'app-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
<div class="page-wrap">
  <div class="page-header">
    <div><h1>Registrations</h1><p>All course registrations and payment status</p></div>
    <button class="btn btn-outline" (click)="exportCsv()">⬇ Export CSV</button>
  </div>

  <!-- FILTERS -->
  <div class="filter-bar">
    <input class="form-control" [(ngModel)]="search" placeholder="Search name or email…" (keyup.enter)="load()" style="max-width:280px">
    <select class="form-control" style="width:auto" [(ngModel)]="statusFilter" (change)="load()">
      <option value="">All Status</option>
      <option value="PENDING">Pending</option>
      <option value="CONFIRMED">Confirmed</option>
      <option value="CANCELLED">Cancelled</option>
      <option value="WAITLISTED">Waitlisted</option>
      <option value="COMPLETED">Completed</option>
    </select>
    <button class="btn btn-outline btn-sm" (click)="load()">Search</button>
  </div>

  <!-- STATS ROW -->
  <div class="stat-chips" *ngIf="!loading()">
    <div class="chip">Total: <strong>{{ regs().length }}</strong></div>
    <div class="chip green">Confirmed: <strong>{{ countStatus('CONFIRMED') }}</strong></div>
    <div class="chip amber">Pending: <strong>{{ countStatus('PENDING') }}</strong></div>
    <div class="chip red">Cancelled: <strong>{{ countStatus('CANCELLED') }}</strong></div>
  </div>

  <div *ngIf="loading()" class="table-card">
    <div *ngFor="let s of [1,2,3,4,5]" class="skeleton-row"></div>
  </div>

  <div *ngIf="!loading()" class="table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>Ref</th><th>Participant</th><th>Course</th>
          <th>Amount</th><th>Status</th><th>Payment</th><th>Date</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of regs()">
          <td><code class="ref-code">{{ r.registrationRef }}</code></td>
          <td>
            <div class="td-title">{{ r.user.fullName }}</div>
            <div class="td-sub">{{ r.user.email }}</div>
            <div class="td-sub" *ngIf="r.user.company">{{ r.user.company }}</div>
          </td>
          <td>
            <div class="td-title">{{ r.course.title }}</div>
            <div class="td-sub">{{ r.course.startDate | date:'d MMM yyyy' }}</div>
          </td>
          <td>
            <div>{{ r.amount | currency:r.currency }}</div>
            <div class="td-sub text-green" *ngIf="r.discountAmount">− {{ r.discountAmount | currency:r.currency }} off</div>
          </td>
          <td><span class="badge" [class]="statusBadge(r.status)">{{ r.status }}</span></td>
          <td><span class="badge" [class]="paymentBadge(r.paymentStatus)">{{ r.paymentStatus }}</span></td>
          <td>{{ r.createdAt | date:'d MMM yy' }}</td>
          <td>
            <div class="action-row">
              <button class="btn-icon-sm text-green" title="Confirm"
                *ngIf="r.status === 'PENDING'"
                (click)="confirm(r.id)">✓ Confirm</button>
              <button class="btn-icon-sm" title="View" (click)="viewDetail(r)">👁</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="regs().length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No registrations found</h3>
    </div>
  </div>
</div>

<!-- DETAIL MODAL -->
<div class="modal-backdrop" *ngIf="selected()" (click)="selected.set(null)">
  <div class="modal-box" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h3>{{ selected()?.registrationRef }}</h3>
      <button class="modal-close" (click)="selected.set(null)">✕</button>
    </div>
    <div class="modal-body" *ngIf="selected()">
      <div class="detail-grid">
        <div class="dg-item"><span>Participant</span><strong>{{ selected()!.user.fullName }}</strong></div>
        <div class="dg-item"><span>Email</span><strong>{{ selected()!.user.email }}</strong></div>
        <div class="dg-item"><span>Course</span><strong>{{ selected()!.course.title }}</strong></div>
        <div class="dg-item"><span>Course Date</span><strong>{{ selected()!.course.startDate | date:'longDate' }}</strong></div>
        <div class="dg-item"><span>Amount</span><strong>{{ selected()!.amount | currency:selected()!.currency }}</strong></div>
        <div class="dg-item"><span>Status</span><span class="badge" [class]="statusBadge(selected()!.status)">{{ selected()!.status }}</span></div>
        <div class="dg-item"><span>Payment</span><span class="badge" [class]="paymentBadge(selected()!.paymentStatus)">{{ selected()!.paymentStatus }}</span></div>
        <div class="dg-item"><span>Coupon</span><strong>{{ selected()!.couponCode || '—' }}</strong></div>
        <div class="dg-item"><span>Registered</span><strong>{{ selected()!.createdAt | date:'medium' }}</strong></div>
        <div class="dg-item" *ngIf="selected()!.confirmedAt"><span>Confirmed</span><strong>{{ selected()!.confirmedAt | date:'medium' }}</strong></div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.page-wrap { max-width:1200px; }
.page-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem; h1{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
.filter-bar { display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap;align-items:center; }
.stat-chips { display:flex;gap:0.75rem;margin-bottom:1.25rem;flex-wrap:wrap; }
.chip { background:white;border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:0.78rem;color:var(--ink-mid); strong{color:var(--ink);} &.green strong{color:var(--green);} &.amber strong{color:var(--amber);} &.red strong{color:var(--red);} }
.table-card { background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden; }
.data-table { width:100%;border-collapse:collapse; }
.data-table th { background:#f9f8f5;padding:0.75rem 1rem;text-align:left;font-size:0.72rem;font-weight:700;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border); }
.data-table td { padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.875rem;vertical-align:middle; }
.data-table tr:last-child td { border-bottom:none; }
.data-table tbody tr:hover { background:#faf9f6; }
.td-title { font-weight:600;color:var(--ink); }
.td-sub { font-size:0.72rem;color:var(--ink-light);margin-top:1px; }
.text-green { color:var(--green) !important; }
.ref-code { font-family:'IBM Plex Mono',monospace;font-size:0.75rem;background:var(--cream-mid);padding:2px 6px;border-radius:4px;color:var(--ink); }
.badge { display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.68rem;font-weight:700; }
.badge-green { background:#dcfce7;color:#166534; }
.badge-yellow { background:#fef9c3;color:#854d0e; }
.badge-red { background:#fee2e2;color:#991b1b; }
.badge-grey { background:#f3f4f6;color:#6b7280; }
.badge-teal { background:var(--teal-light);color:var(--teal); }
.action-row { display:flex;gap:4px;align-items:center; }
.btn-icon-sm { background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:0.75rem;cursor:pointer;white-space:nowrap;&:hover{background:var(--cream);} &.text-green{color:var(--green);border-color:var(--green);} }
.skeleton-row { height:60px;background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-bottom:1px solid var(--border); }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.empty-state { text-align:center;padding:3rem; .empty-icon{font-size:2.5rem;margin-bottom:1rem;} h3{font-weight:700;} }
.modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;display:flex;align-items:center;justify-content:center;padding:2rem; }
.modal-box { background:white;border-radius:16px;width:100%;max-width:540px; }
.modal-header { display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border); h3{font-family:'Lora',serif;font-weight:700;} }
.modal-close { background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--ink-mid); }
.modal-body { padding:1.5rem; }
.detail-grid { display:grid;grid-template-columns:1fr 1fr;gap:0.75rem; }
.dg-item { display:flex;flex-direction:column;gap:2px; span:first-child{font-size:0.72rem;color:var(--ink-light);font-weight:600;text-transform:uppercase;letter-spacing:0.04em;} strong{font-size:0.875rem;color:var(--ink);} }
`]
})
export class RegistrationsComponent implements OnInit {
  private adminService = inject(AdminService);
  private regService   = inject(RegistrationService);

  regs     = signal<any[]>([]);
  loading  = signal(true);
  selected = signal<any>(null);
  search   = '';
  statusFilter = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getAllRegistrations({ status: this.statusFilter, search: this.search }).subscribe({
      next: r => { this.regs.set(r.data?.content || r.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  confirm(id: number) {
    this.adminService.getAllRegistrations({}).subscribe(); // placeholder — use registrationService.confirmRegistration
    this.load();
  }

  viewDetail(r: any) { this.selected.set(r); }

  exportCsv() {
    this.adminService.exportCsv().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'registrations.csv'; a.click();
    });
  }

  countStatus(s: string): number { return this.regs().filter(r => r.status === s).length; }

  statusBadge(s: string): string {
    return { CONFIRMED:'badge-green', PENDING:'badge-yellow', CANCELLED:'badge-red', WAITLISTED:'badge-grey', COMPLETED:'badge-teal' }[s] || 'badge-grey';
  }
  paymentBadge(s: string): string {
    return { PAID:'badge-green', PENDING:'badge-yellow', FAILED:'badge-red', REFUNDED:'badge-grey' }[s] || 'badge-grey';
  }
}
