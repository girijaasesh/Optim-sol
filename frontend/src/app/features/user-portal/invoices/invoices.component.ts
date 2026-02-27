import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RegistrationService } from '../../../core/services/services';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
<div class="invoices-page">
  <div class="page-header">
    <h1>Invoices & Receipts</h1>
    <p>Download invoices for your course registrations</p>
  </div>

  <div *ngIf="loading()" class="inv-list">
    <div *ngFor="let s of [1,2,3]" class="inv-row skeleton"></div>
  </div>

  <div *ngIf="!loading()" class="inv-list">
    <div *ngFor="let r of paid()" class="inv-row">
      <div class="inv-icon">🧾</div>
      <div class="inv-info">
        <div class="inv-title">{{ r.course.title }}</div>
        <div class="inv-meta">
          <span>Ref: {{ r.registrationRef }}</span>
          <span>{{ r.confirmedAt | date:'d MMM yyyy' }}</span>
        </div>
      </div>
      <div class="inv-amount">{{ r.amount | currency:r.currency }}</div>
      <div class="inv-actions">
        <button class="btn btn-outline btn-sm" (click)="download(r)">⬇ PDF</button>
      </div>
    </div>
    <div *ngIf="paid().length === 0" class="empty-state">
      <div class="empty-icon">🧾</div>
      <h3>No invoices yet</h3>
      <p>Confirmed registrations will appear here with downloadable invoices.</p>
    </div>
  </div>
</div>
  `,
  styles: [`
.invoices-page { max-width:760px; }
.page-header { margin-bottom:2rem; h1{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
.inv-list { display:flex;flex-direction:column;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden; }
.inv-row { background:white;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;transition:background 0.15s; &:hover{background:#faf9f6;} &.skeleton{height:72px;background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;} }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.inv-icon { font-size:1.5rem;width:44px;height:44px;background:var(--cream-mid);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.inv-info { flex:1; }
.inv-title { font-weight:600;font-size:0.875rem;color:var(--ink); }
.inv-meta { font-size:0.72rem;color:var(--ink-light);display:flex;gap:1rem;margin-top:2px; }
.inv-amount { font-weight:700;font-size:1rem;color:var(--ink);white-space:nowrap; }
.empty-state { text-align:center;padding:3rem;background:white; .empty-icon{font-size:2.5rem;margin-bottom:1rem;} h3{font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
`]
})
export class InvoicesComponent implements OnInit {
  private regService = inject(RegistrationService);
  regs    = signal<any[]>([]);
  paid    = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.regService.getMyRegistrations().subscribe({
      next: r => {
        this.regs.set(r.data || []);
        this.paid.set((r.data || []).filter((reg: any) => reg.paymentStatus === 'PAID'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  download(r: any) {
    // In production: fetch invoice PDF from backend
    alert(`Invoice ${r.registrationRef} — download coming soon`);
  }
}
