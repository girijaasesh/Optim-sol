import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#faf8f3;padding:2rem"><div style="background:white;border-radius:16px;padding:2.5rem;max-width:420px;width:100%;border:1px solid #e2e0d9"><div style="font-size:2rem;margin-bottom:1rem">🔑</div><h2 style="font-family:Georgia,serif;font-size:1.4rem;font-weight:700;margin-bottom:1.5rem">Set New Password</h2><div *ngIf="msg()" [style.background]="success()?'#f0fdf4':'#fef2f2'" [style.color]="success()?'#166534':'#991b1b'" style="padding:0.75rem;border-radius:8px;font-size:0.82rem;margin-bottom:1rem">{{ msg() }}</div><form *ngIf="!success()" [formGroup]="form" style="display:flex;flex-direction:column;gap:1rem"><input formControlName="newPassword" type="password" style="padding:11px 14px;border:1.5px solid #d4d0c8;border-radius:8px;font-size:0.9rem" placeholder="New password (8+ characters)"><input formControlName="confirm" type="password" style="padding:11px 14px;border:1.5px solid #d4d0c8;border-radius:8px;font-size:0.9rem" placeholder="Confirm password"><button type="button" (click)="submit()" [disabled]="form.invalid || saving()" style="background:#1a1612;color:white;padding:13px;border:none;border-radius:8px;font-weight:700;cursor:pointer">{{ saving() ? 'Saving…' : 'Update Password' }}</button></form><a *ngIf="success()" routerLink="/login" style="display:inline-block;margin-top:1.25rem;background:#1a1612;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">Sign In</a></div></div>`
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);
  private fb    = inject(FormBuilder);
  token = '';
  saving = signal(false);
  success = signal(false);
  msg = signal('');
  form = this.fb.group({ newPassword: ['', [Validators.required, Validators.minLength(8)]], confirm: ['', Validators.required] });

  ngOnInit() { this.token = this.route.snapshot.queryParamMap.get('token') || ''; }

  submit() {
    if (this.form.value.newPassword !== this.form.value.confirm) { this.msg.set('Passwords do not match'); return; }
    this.saving.set(true);
    this.auth.resetPassword({ token: this.token, newPassword: this.form.value.newPassword }).subscribe({
      next: r => { this.saving.set(false); this.success.set(r.success); this.msg.set(r.message); },
      error: e => { this.saving.set(false); this.msg.set(e.error?.message || 'Failed'); }
    });
  }
}
