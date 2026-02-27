import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#faf8f3;padding:2rem"><div style="background:white;border-radius:16px;padding:3rem;text-align:center;max-width:440px;width:100%;border:1px solid #e2e0d9"><div style="font-size:3rem;margin-bottom:1rem">{{ icon() }}</div><h2 style="font-family:Georgia,serif;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem">{{ title() }}</h2><p style="color:#6b6358;font-size:0.875rem">{{ message() }}</p><a *ngIf="success()" routerLink="/login" style="display:inline-block;margin-top:1.5rem;background:#1a1612;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">Sign In</a></div></div>`
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);
  success = signal(false);
  icon    = signal('⏳');
  title   = signal('Verifying…');
  message = signal('Please wait…');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.icon.set('❌'); this.title.set('Invalid Link'); this.message.set('No token found.'); return; }
    this.auth.verifyEmail(token).subscribe({
      next: r => { if (r.success) { this.success.set(true); this.icon.set('✅'); this.title.set('Email Verified!'); this.message.set(r.message); } else { this.icon.set('❌'); this.title.set('Failed'); this.message.set(r.message); } },
      error: e => { this.icon.set('❌'); this.title.set('Failed'); this.message.set(e.error?.message || 'Link may be expired.'); }
    });
  }
}
