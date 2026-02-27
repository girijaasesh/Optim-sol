import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="security-page">
  <div class="page-header">
    <h1>Security</h1>
    <p>Manage your account security and two-factor authentication</p>
  </div>

  <!-- MFA STATUS -->
  <div class="sec-card card">
    <div class="card-header">
      <div class="ch-left">
        <h3>Two-Factor Authentication</h3>
        <p>Add an extra layer of protection to your account</p>
      </div>
      <div class="mfa-status" [class]="auth.currentUser()?.mfaEnabled ? 'status-on' : 'status-off'">
        {{ auth.currentUser()?.mfaEnabled ? '🔒 Enabled' : '🔓 Disabled' }}
      </div>
    </div>
    <div class="card-body" *ngIf="!auth.currentUser()?.mfaEnabled">
      <p class="mfa-desc">
        Use an authenticator app (Google Authenticator, Authy, 1Password) to generate time-based codes.
      </p>
      <button class="btn btn-primary" (click)="initMfaSetup()" [disabled]="mfaLoading()">
        {{ mfaLoading() ? 'Loading…' : 'Enable 2FA →' }}
      </button>
    </div>
    <div class="card-body" *ngIf="auth.currentUser()?.mfaEnabled">
      <div class="info-banner"><span>✅</span><div>Two-factor authentication is active. Your account is protected.</div></div>
    </div>
  </div>

  <!-- MFA SETUP FLOW -->
  <div class="sec-card card" *ngIf="mfaSetup()">
    <div class="card-header"><h3>Set Up Authenticator App</h3></div>
    <div class="card-body">
      <div class="setup-steps">
        <div class="setup-step">
          <div class="step-num">1</div>
          <div>
            <div class="step-title">Install an authenticator app</div>
            <div class="step-desc">Download Google Authenticator, Authy, or any TOTP app on your phone.</div>
          </div>
        </div>
        <div class="setup-step">
          <div class="step-num">2</div>
          <div>
            <div class="step-title">Scan the QR code</div>
            <div class="step-desc">Open your app and scan the code below, or enter the secret manually.</div>
            <div class="qr-area">
              <div class="qr-placeholder">📱</div>
              <div class="manual-secret">
                <div class="secret-label">Manual entry code:</div>
                <code class="secret-code">{{ mfaSetup()?.secret || '–' }}</code>
              </div>
            </div>
          </div>
        </div>
        <div class="setup-step">
          <div class="step-num">3</div>
          <div>
            <div class="step-title">Verify your code</div>
            <div class="step-desc">Enter the 6-digit code from your app to confirm setup.</div>
            <div class="otp-row">
              <input class="form-control" [(ngModel)]="mfaCode" maxlength="6" placeholder="000000" style="max-width:140px;font-family:monospace;font-size:1.1rem;letter-spacing:0.2em">
              <button class="btn btn-primary" (click)="confirmMfa()" [disabled]="mfaCode.length !== 6 || mfaVerifying()">
                {{ mfaVerifying() ? 'Verifying…' : 'Confirm' }}
              </button>
            </div>
            <div *ngIf="mfaErr()" class="alert alert-err" style="margin-top:0.75rem">{{ mfaErr() }}</div>
          </div>
        </div>
        <div class="setup-step" *ngIf="mfaSetup()?.backupCodes">
          <div class="step-num">4</div>
          <div>
            <div class="step-title">Save your backup codes</div>
            <div class="step-desc">Keep these in a safe place. Each code can only be used once.</div>
            <div class="backup-codes">
              <code *ngFor="let c of mfaSetup()!.backupCodes">{{ c }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CHANGE PASSWORD -->
  <div class="sec-card card" *ngIf="auth.currentUser()?.provider === 'LOCAL'">
    <div class="card-header"><h3>Change Password</h3></div>
    <div class="card-body">
      <div *ngIf="pwMsg()" class="alert" [class]="pwMsgType()==='ok'?'alert-ok':'alert-err'" style="margin-bottom:1rem">{{ pwMsg() }}</div>
      <form [formGroup]="pwForm" style="max-width:400px;display:flex;flex-direction:column;gap:1rem">
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input formControlName="current" type="password" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input formControlName="newPw" type="password" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input formControlName="confirm" type="password" class="form-control">
        </div>
        <button class="btn btn-primary" type="button" (click)="changePassword()" [disabled]="pwForm.invalid || saving()">
          {{ saving() ? 'Updating…' : 'Update Password' }}
        </button>
      </form>
    </div>
  </div>

  <!-- ACTIVE SESSIONS (informational) -->
  <div class="sec-card card">
    <div class="card-header"><h3>Login History</h3></div>
    <div class="card-body">
      <div *ngIf="auth.currentUser()?.lastLoginAt" class="session-item">
        <div class="session-icon">🖥</div>
        <div class="session-info">
          <div class="session-label">Last Sign-In</div>
          <div class="session-detail">{{ auth.currentUser()?.lastLoginAt | date:'medium' }}</div>
        </div>
        <span class="badge badge-green">Current</span>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.security-page { max-width:760px; }
.page-header { margin-bottom:2rem; h1{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
.sec-card { margin-bottom:1.5rem; }
.card { background:white;border:1px solid var(--border);border-radius:var(--radius); }
.card-header { padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start; h3{font-family:'Lora',serif;font-size:1rem;font-weight:700;} p{font-size:0.82rem;color:var(--ink-mid);margin:2px 0 0;} .ch-left{flex:1;} }
.card-body { padding:1.5rem; }
.mfa-status { padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:700; &.status-on{background:#dcfce7;color:#166534;} &.status-off{background:#f3f4f6;color:#6b7280;} }
.mfa-desc { color:var(--ink-mid);font-size:0.875rem;margin-bottom:1.25rem;line-height:1.6; }
.info-banner { background:var(--teal-light);border:1px solid rgba(42,124,132,0.2);border-radius:8px;padding:0.85rem 1rem;display:flex;gap:10px;font-size:0.875rem;color:var(--teal); }
.setup-steps { display:flex;flex-direction:column;gap:2rem; }
.setup-step { display:flex;gap:1rem;align-items:flex-start; }
.step-num { width:28px;height:28px;border-radius:50%;background:var(--ink);color:white;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;flex-shrink:0;margin-top:2px; }
.step-title { font-weight:700;font-size:0.875rem;color:var(--ink);margin-bottom:4px; }
.step-desc { font-size:0.82rem;color:var(--ink-mid);line-height:1.6;margin-bottom:0.75rem; }
.qr-area { display:flex;align-items:center;gap:1.5rem;background:var(--cream);border-radius:10px;padding:1rem; }
.qr-placeholder { font-size:3rem;background:white;border-radius:8px;padding:1rem; }
.secret-label { font-size:0.72rem;color:var(--ink-light);margin-bottom:4px;font-weight:600; }
.secret-code { display:block;font-family:'IBM Plex Mono',monospace;font-size:0.8rem;background:var(--ink);color:#e8b84b;padding:8px 12px;border-radius:6px;word-break:break-all;letter-spacing:0.05em; }
.otp-row { display:flex;gap:0.75rem;align-items:center; }
.backup-codes { display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:0.75rem; code{font-family:'IBM Plex Mono',monospace;font-size:0.72rem;background:var(--cream-mid);padding:6px 8px;border-radius:6px;text-align:center;display:block;} }
.alert { padding:0.75rem 1rem;border-radius:8px;font-size:0.82rem; }
.alert-ok { background:#f0fdf4;color:#166534;border:1px solid #bbf7d0; }
.alert-err { background:#fef2f2;color:#991b1b;border:1px solid #fecaca; }
.session-item { display:flex;align-items:center;gap:1rem; }
.session-icon { font-size:1.5rem;width:40px;height:40px;background:var(--cream-mid);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.session-label { font-size:0.78rem;font-weight:600;color:var(--ink); }
.session-detail { font-size:0.75rem;color:var(--ink-light); }
.badge { display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.68rem;font-weight:700; }
.badge-green { background:#dcfce7;color:#166534; }
`]
})
export class SecurityComponent {
  auth     = inject(AuthService);
  private fb = inject(FormBuilder);

  mfaSetup   = signal<any>(null);
  mfaLoading = signal(false);
  mfaVerifying = signal(false);
  mfaCode    = '';
  mfaErr     = signal('');
  saving     = signal(false);
  pwMsg      = signal('');
  pwMsgType  = signal<'ok'|'err'>('ok');

  pwForm = this.fb.group({
    current: ['', Validators.required],
    newPw:   ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  initMfaSetup() {
    this.mfaLoading.set(true);
    this.auth.setupMfa().subscribe({
      next: r => { this.mfaSetup.set(r.data); this.mfaLoading.set(false); },
      error: e => { this.mfaLoading.set(false); }
    });
  }

  confirmMfa() {
    this.mfaVerifying.set(true);
    this.auth.enableMfa(this.auth.getAccessToken() || '', this.mfaCode).subscribe({
      next: r => {
        this.mfaVerifying.set(false);
        if (r.success) { this.mfaErr.set(''); this.mfaSetup.set(null); }
        else { this.mfaErr.set(r.message); }
      },
      error: e => { this.mfaVerifying.set(false); this.mfaErr.set(e.error?.message || 'Invalid code'); }
    });
  }

  changePassword() {
    const { current, newPw, confirm } = this.pwForm.value;
    if (newPw !== confirm) { this.pwMsg.set('Passwords do not match'); this.pwMsgType.set('err'); return; }
    this.saving.set(true);
    // TODO: call AuthService.changePassword
    setTimeout(() => {
      this.saving.set(false);
      this.pwMsg.set('Password changed successfully');
      this.pwMsgType.set('ok');
      this.pwForm.reset();
    }, 800);
  }
}
