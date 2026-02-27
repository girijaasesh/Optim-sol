import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RegistrationService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-certificates',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="certs-page">
  <div class="page-header">
    <div>
      <h1>My Certificates</h1>
      <p>Your earned SAFe® certifications</p>
    </div>
  </div>

  <div *ngIf="loading()" class="certs-grid">
    <div *ngFor="let s of [1,2]" class="cert-card skeleton"></div>
  </div>

  <div *ngIf="!loading() && certs().length > 0" class="certs-grid">
    <div *ngFor="let c of certs()" class="cert-card">
      <div class="cert-ribbon">CERTIFIED</div>
      <div class="cert-seal">🏆</div>
      <div class="cert-body">
        <div class="cert-from">AgilePro Institute</div>
        <h3 class="cert-name">{{ c.certificationName }}</h3>
        <div class="cert-holder">{{ c.participantName }}</div>
        <div class="cert-meta">
          <span>Issued {{ c.issueDate | date:'d MMMM yyyy' }}</span>
          <span class="cert-id">{{ c.certificateId }}</span>
        </div>
      </div>
      <div class="cert-actions">
        <a [href]="c.pdfPath" target="_blank" class="btn btn-primary btn-sm">⬇ Download PDF</a>
        <button class="btn btn-outline btn-sm" (click)="copyVerifyLink(c)">🔗 Copy Verify Link</button>
      </div>
    </div>
  </div>

  <div *ngIf="!loading() && certs().length === 0" class="empty-state">
    <div class="empty-icon">🏆</div>
    <h2>No certificates yet</h2>
    <p>Complete a SAFe® course to earn your certification.</p>
    <a routerLink="/portal/my-courses" class="btn btn-primary">View My Courses →</a>
  </div>
</div>
  `,
  styles: [`
.certs-page { max-width:800px; }
.page-header { margin-bottom:2rem; h1{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
.certs-grid { display:grid;gap:1.5rem; }
.cert-card {
  background:white;border:1px solid var(--border);border-radius:16px;
  padding:2rem;position:relative;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;text-align:center;gap:1rem;
  &::before { content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--amber),var(--teal)); }
  &.skeleton { min-height:240px;background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border:none; }
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.cert-ribbon { position:absolute;top:12px;right:-24px;background:var(--amber);color:white;font-size:0.65rem;font-weight:800;letter-spacing:0.12em;padding:3px 32px 3px 16px;transform:rotate(12deg); }
.cert-seal { font-size:3rem;margin-top:0.5rem; }
.cert-from { font-size:0.72rem;font-weight:700;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.1em; }
.cert-name { font-family:'Lora',serif;font-size:1.5rem;font-weight:700;color:var(--ink);line-height:1.2; }
.cert-holder { font-size:1rem;font-weight:600;color:var(--teal);font-style:italic; }
.cert-meta { display:flex;gap:1rem;justify-content:center;font-size:0.75rem;color:var(--ink-light);flex-wrap:wrap; }
.cert-id { font-family:'IBM Plex Mono',monospace; }
.cert-actions { display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center; }
.empty-state { text-align:center;padding:4rem 2rem; .empty-icon{font-size:3.5rem;margin-bottom:1rem;} h2{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;margin-bottom:0.5rem;} p{color:var(--ink-mid);max-width:380px;margin:0 auto 1.5rem;} }
`]
})
export class MyCertificatesComponent implements OnInit {
  auth    = inject(AuthService);
  private regService = inject(RegistrationService);

  certs   = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    // In a real implementation, fetch /api/users/me/certificates
    // For now load from registrations and check for certificates
    setTimeout(() => { this.certs.set([]); this.loading.set(false); }, 600);
  }

  copyVerifyLink(c: any) {
    navigator.clipboard.writeText(c.verificationUrl || window.location.origin + '/verify/' + c.certificateId);
  }
}
