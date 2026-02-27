import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminService, CourseService } from '../../../core/services/services';

@Component({
  selector: 'app-corporate',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
<div class="page-wrap">
  <div class="page-header" style="margin-bottom:1.5rem">
    <div>
      <h1 style="font-family:'Lora',serif;font-size:1.75rem;font-weight:700">Corporate Groups</h1>
      <p style="color:var(--ink-mid);font-size:0.875rem">Manage bulk/corporate bookings</p>
    </div>
  </div>
  <div *ngIf="loading()" style="display:flex;flex-direction:column;gap:8px">
    <div *ngFor="let s of [1,2,3]" style="height:60px;background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:var(--radius)"></div>
  </div>

  <div class="info-banner"><span>🏢</span><div>Corporate group bookings receive custom discounts and invoiced payment options. Contact your account manager to set up a new corporate arrangement.</div></div>
  <div class="empty-state" style="margin-top:2rem"><div class="empty-icon">🏢</div><h3>Corporate bookings module</h3><p>Manage bulk registrations, group discounts (10–25%), and invoice-based payment for organizations booking 5+ seats.</p><button class="btn btn-primary" style="margin-top:1rem">Contact Sales</button></div>
</div>
  `,
  styles: [`
:host { display:block; }
.page-wrap { max-width:1200px; }
.table-card { background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:auto; }
.data-table { width:100%;border-collapse:collapse; }
.data-table th { background:#f9f8f5;padding:0.75rem 1rem;text-align:left;font-size:0.72rem;font-weight:700;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border); }
.data-table td { padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.875rem;vertical-align:middle; }
.data-table tbody tr:hover { background:#faf9f6; }
.td-title { font-weight:600;color:var(--ink); } .td-sub { font-size:0.72rem;color:var(--ink-light);margin-top:1px; }
.badge { display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.7rem;font-weight:700; }
.badge-green { background:#dcfce7;color:#166534; } .badge-red { background:#fee2e2;color:#991b1b; } .badge-grey { background:#f3f4f6;color:#6b7280; } .badge-yellow { background:#fef9c3;color:#854d0e; } .badge-teal { background:var(--teal-light);color:var(--teal); }
.ref-code { font-family:'IBM Plex Mono',monospace;font-size:0.75rem;background:var(--cream-mid);padding:2px 6px;border-radius:4px; }
.kpi-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem; }
.kpi-card { background:white;border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;display:flex;align-items:flex-start;gap:1rem; }
.kpi-icon { width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0; }
.kpi-label { font-size:0.72rem;font-weight:600;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px; }
.kpi-value { font-size:1.6rem;font-weight:700;font-family:'Lora',serif;color:var(--ink);line-height:1; }
.bar-chart { display:flex;align-items:flex-end;gap:8px;height:180px; }
.bar-col { flex:1;display:flex;flex-direction:column;align-items:center;gap:4px; }
.bar-val { font-size:0.6rem;color:var(--ink-light);white-space:nowrap; }
.bar-wrap { flex:1;width:100%;background:var(--cream-mid);border-radius:4px 4px 0 0;display:flex;align-items:flex-end;min-height:20px; }
.bar-fill { width:100%;background:var(--teal);border-radius:4px 4px 0 0; }
.bar-lbl { font-size:0.6rem;color:var(--ink-light);text-align:center; }
.card { background:white;border:1px solid var(--border);border-radius:var(--radius); }
.card-header { padding:1.25rem 1.5rem;border-bottom:1px solid var(--border); h3{font-family:'Lora',serif;font-size:1rem;font-weight:700;} }
.empty-state { text-align:center;padding:3rem; .empty-icon{font-size:2.5rem;margin-bottom:1rem;} h3{font-weight:700;} p{color:var(--ink-mid);} }
.info-banner { background:var(--teal-light);border:1px solid rgba(42,124,132,0.2);border-radius:10px;padding:1rem 1.25rem;display:flex;gap:12px;margin-bottom:1.5rem;font-size:0.875rem;color:var(--teal);}
.alert-ok { background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;border-radius:8px;padding:0.75rem 1rem;font-size:0.82rem; }
.alert-err { background:#fef2f2;color:#991b1b;border:1px solid #fecaca;border-radius:8px;padding:0.75rem 1rem;font-size:0.82rem; }
.text-red { color:var(--red); } .text-amber { color:var(--amber); }
.modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;display:flex;align-items:center;justify-content:center;padding:2rem; }
.modal-box { background:white;border-radius:16px;width:100%;max-width:540px; }
.modal-header { display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border); h3{font-family:'Lora',serif;font-weight:700;} }
.modal-close { background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--ink-mid); }
.modal-body { padding:1.5rem; }
.modal-footer { padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:0.75rem; }
.form-grid { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
.btn-icon-sm { background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:0.75rem;cursor:pointer;&:hover{background:var(--cream);} }
.quick-issue { background:white;border:1px solid var(--border);border-radius:var(--radius); }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`]
})
export class CorporateComponent implements OnInit {
  private adminService = inject(AdminService);
  private cs = inject(CourseService);
  private fb = inject(FormBuilder);

  loading  = signal(true);
  stats    = signal<any>(null);
  certs    = signal<any[]>([]);
  coupons  = signal<any[]>([]);
  waitlist = signal<any[]>([]);
  courses  = signal<any[]>([]);
  showCreate = signal(false);
  saving   = signal(false);
  msg      = signal('');
  msgType  = signal<'ok'|'err'>('ok');
  issueRegId = signal<number|null>(null);
  issuing  = signal(false);
  issueMsg = signal('');
  issueMsgType = signal<'ok'|'err'>('ok');

  form = this.fb.group({
    code:              ['', Validators.required],
    discountType:      ['PERCENTAGE', Validators.required],
    discountValue:     [null, [Validators.required, Validators.min(1)]],
    usageLimit:        [null],
    expiryDate:        [''],
    applicableCourseType: [''],
  });

  ngOnInit() {
    this.adminService.getDashboardStats().subscribe({ next: r => this.stats.set(r.data) });
    this.cs.getPublicCourses().subscribe({ next: r => { this.courses.set(r.data || []); this.loading.set(false); } });
    // Load certs and coupons via admin endpoints
    setTimeout(() => this.loading.set(false), 500);
  }

  create() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.adminService.createCoupon(this.form.value).subscribe({
      next: r => { this.saving.set(false); this.msg.set(r.message); this.msgType.set('ok'); setTimeout(() => this.showCreate.set(false), 1200); },
      error: e => { this.saving.set(false); this.msg.set(e.error?.message||'Failed'); this.msgType.set('err'); }
    });
  }

  issueCert() {
    const id = this.issueRegId();
    if (!id) return;
    this.issuing.set(true);
    this.adminService.issueCertificate(id).subscribe({
      next: r => { this.issuing.set(false); this.issueMsg.set(r.message); this.issueMsgType.set('ok'); },
      error: e => { this.issuing.set(false); this.issueMsg.set(e.error?.message||'Failed'); this.issueMsgType.set('err'); }
    });
  }

  wBadge(s: string): string {
    return {'WAITING':'badge-yellow','NOTIFIED':'badge-teal','CONVERTED':'badge-green','EXPIRED':'badge-grey'}[s] || 'badge-grey';
  }

  getBarH(rev: number): number {
    const max = Math.max(...(this.stats()?.monthlyRevenue?.map((m: any) => m.revenue) || [1]));
    return max > 0 ? (rev / max) * 100 : 0;
  }

  formatType(t: string) { return t.replace(/_/g,' ').replace('SAFE','SAFe®'); }
}
