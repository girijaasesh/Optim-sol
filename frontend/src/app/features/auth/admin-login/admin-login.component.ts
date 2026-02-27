// src/app/features/auth/admin-login/admin-login.component.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type AdminPanel = 'credentials' | 'mfa' | 'backup' | 'forgot';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="admin-shell">
  <!-- SCAN OVERLAY -->
  <div class="scan-overlay"></div>

  <!-- SIDEBAR -->
  <div class="side-rail">
    <div class="rail-logo">A</div>
    <div class="rail-sep"></div>
    <div class="rail-icon active" title="Auth">🛡</div>
    <div class="rail-icon" title="Dashboard">📊</div>
    <div class="rail-icon" title="Courses">📚</div>
    <div class="rail-icon" title="Users">👥</div>
    <div class="rail-bottom">
      <div class="rail-icon" title="Settings">⚙️</div>
    </div>
  </div>

  <!-- MAIN -->
  <div class="main-area">
    <!-- STATUS BAR -->
    <div class="status-bar">
      <div class="status-items">
        <div class="s-item"><span class="dot green"></span> SYSTEM ONLINE</div>
        <div class="s-item"><span class="dot amber"></span> ADMIN PORTAL v3.2.1</div>
        <div class="s-item"><span class="dot green"></span> TLS 1.3 ACTIVE</div>
        <div class="s-item"><span class="dot green"></span> 2FA ENFORCED</div>
      </div>
      <div class="utc-clock">{{ clock() }}</div>
    </div>

    <!-- CONTENT -->
    <div class="login-wrap">
      <div class="card-eyebrow">// AGILEPRO INSTITUTE</div>
      <div class="card-title">Admin <span>Command</span><br>Center</div>
      <p class="card-desc">
        // RESTRICTED ACCESS — Authorized personnel only<br>
        // All sessions are encrypted, logged and audited
      </p>

      <!-- AUTH BOX -->
      <div class="auth-box">

        <!-- LOCKOUT OVERLAY -->
        <div class="lockout" *ngIf="locked()">
          <div class="lock-icon">🔒</div>
          <div class="lock-title">ACCESS SUSPENDED</div>
          <div class="lock-desc">Multiple failed attempts detected. This incident has been logged. Account temporarily suspended for security.</div>
          <div class="lock-timer">{{ lockTimer() }}</div>
          <div class="lock-progress"><div class="lock-bar" [style.width.%]="lockProgress()"></div></div>
          <button class="adm-btn" (click)="contactSupport()">Contact Security Team</button>
        </div>

        <!-- HEADER -->
        <div class="box-header">
          <div class="window-dots">
            <span class="wd red"></span><span class="wd yellow"></span><span class="wd green"></span>
          </div>
          <div class="header-path">admin.agilepro.institute // secure session</div>
          <div class="step-label">{{ stepLabel() }}</div>
        </div>

        <div class="box-body">

          <!-- ── CREDENTIALS PANEL ── -->
          <div *ngIf="panel() === 'credentials'">
            <div class="policy-box">
              <span class="policy-icon">⚠</span>
              <div class="policy-text">
                <strong>Restricted System Access.</strong> Unauthorized use is prohibited and monitored.
                All activity is subject to audit and logging per company security policy.
              </div>
            </div>

            <div *ngIf="alert()" class="adm-alert" [class]="'adm-alert-' + alertType()">
              <span class="alert-icon">{{ alertType() === 'ok' ? '✓' : alertType() === 'warn' ? '⚠' : '✗' }}</span>
              <span>{{ alert() }}</span>
            </div>

            <!-- Attempt Tracker -->
            <div class="attempt-track">
              <div class="attempt-meta">
                <span>LOGIN ATTEMPTS</span>
                <span [class.text-red]="failedAttempts() >= 3">{{ 5 - failedAttempts() }} REMAINING</span>
              </div>
              <div class="attempt-pips">
                <div *ngFor="let i of [0,1,2,3,4]" class="pip" [class.pip-used]="i < failedAttempts()"></div>
              </div>
            </div>

            <form [formGroup]="credForm" (ngSubmit)="doLogin()">
              <div class="adm-group">
                <div class="adm-label">ADMIN EMAIL <span class="req">*</span></div>
                <div class="adm-input-wrap">
                  <input formControlName="email" class="adm-input" type="email"
                    placeholder="admin@agilepro.institute"
                    [class.adm-input-err]="credForm.get('email')?.invalid && credForm.get('email')?.touched"
                    [class.adm-input-ok]="credForm.get('email')?.valid && credForm.get('email')?.value">
                  <span class="adm-trail" [style.color]="credForm.get('email')?.valid && credForm.get('email')?.value ? 'var(--green)' : 'var(--text-dim)'">
                    {{ credForm.get('email')?.valid && credForm.get('email')?.value ? '✓' : '_' }}
                  </span>
                </div>
              </div>

              <div class="adm-group">
                <div class="adm-label-row">
                  <span>PASSWORD <span class="req">*</span></span>
                  <a (click)="setPanel('forgot')">Reset →</a>
                </div>
                <div class="adm-input-wrap">
                  <input formControlName="password" [type]="showPw() ? 'text' : 'password'"
                    class="adm-input" placeholder="••••••••••••••">
                  <button type="button" class="adm-trail" (click)="showPw.set(!showPw())" style="cursor:pointer;background:none;border:none;">
                    {{ showPw() ? '🙈' : '👁' }}
                  </button>
                </div>
              </div>

              <label class="adm-remember">
                <input type="checkbox" formControlName="rememberDevice"> Trust this device for 8 hours
              </label>

              <button type="submit" class="adm-submit" [disabled]="loading()">
                <span *ngIf="!loading()">→ AUTHENTICATE</span>
                <span *ngIf="loading()" class="spinner"></span>
              </button>
            </form>
          </div>

          <!-- ── MFA PANEL ── -->
          <div *ngIf="panel() === 'mfa'">
            <div *ngIf="alert()" class="adm-alert" [class]="'adm-alert-' + alertType()">
              {{ alert() }}
            </div>

            <div class="mfa-zone">
              <div class="mfa-icon">🔐</div>
              <div class="mfa-title">Two-Factor Authentication</div>
              <div class="mfa-sub">Enter the 6-digit code from your Authenticator app<br>(Google Authenticator / Authy)</div>
              <div class="totp-row">
                <input *ngFor="let i of [0,1,2,3,4,5]"
                  class="totp-cell" maxlength="1" inputmode="numeric"
                  [id]="'totp-' + i"
                  (input)="onTotpInput($event, i)"
                  (keydown)="onTotpKeydown($event, i)">
              </div>
              <div class="mfa-hint">
                Lost authenticator? <a (click)="setPanel('backup')">Use backup code</a> · <a (click)="setPanel('credentials')">← Back</a>
              </div>
            </div>

            <div class="totp-note">Code refreshes every 30 seconds. Never share this code with anyone, including support staff.</div>

            <button class="adm-submit" (click)="verifyMfa()" [disabled]="loading()">
              <span *ngIf="!loading()">→ VERIFY & ENTER</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
          </div>

          <!-- ── BACKUP CODE PANEL ── -->
          <div *ngIf="panel() === 'backup'">
            <div *ngIf="alert()" class="adm-alert" [class]="'adm-alert-' + alertType()">{{ alert() }}</div>
            <div class="adm-group">
              <div class="adm-label">BACKUP CODE <span class="req">*</span></div>
              <div class="adm-input-wrap">
                <input [formControl]="backupCodeControl" class="adm-input backup-input"
                  placeholder="XXXX-XXXX-XXXX" maxlength="14">
                <span class="adm-trail">🔑</span>
              </div>
              <div class="adm-note">Each backup code can only be used once. You have 8 remaining.</div>
            </div>
            <button class="adm-submit" (click)="verifyBackup()" [disabled]="loading()">
              <span *ngIf="!loading()">→ VERIFY BACKUP CODE</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
            <div class="back-link"><a (click)="setPanel('mfa')">← Back to authenticator</a></div>
          </div>

          <!-- ── FORGOT PANEL ── -->
          <div *ngIf="panel() === 'forgot'">
            <div class="policy-box">
              <span class="policy-icon">ℹ</span>
              <div class="policy-text">
                Admin password reset requires <strong>email verification + manager approval</strong>.
                Requests are reviewed within 1 business hour.
              </div>
            </div>
            <div *ngIf="alert()" class="adm-alert" [class]="'adm-alert-' + alertType()">{{ alert() }}</div>
            <div class="adm-group">
              <div class="adm-label">REGISTERED ADMIN EMAIL</div>
              <div class="adm-input-wrap">
                <input [formControl]="forgotEmailControl" class="adm-input" type="email"
                  placeholder="admin@agilepro.institute">
                <span class="adm-trail">✉</span>
              </div>
            </div>
            <button class="adm-submit" (click)="forgotPassword()" [disabled]="loading()">
              <span *ngIf="!loading()">→ REQUEST SECURE RESET</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
            <div class="back-link"><a (click)="setPanel('credentials')">← Back to login</a></div>
          </div>

        </div>

        <!-- BOX FOOTER -->
        <div class="box-footer">
          <div class="bf-left">SESSION — <span class="ip-text">{{ sessionIp }}</span></div>
          <div class="bf-right">
            <a (click)="setPanel('forgot')">Recover Access</a>
            <a href="mailto:security@agilepro.institute">Report Issue</a>
          </div>
        </div>
      </div>

      <!-- AUDIT NOTICE -->
      <div class="audit-strip">
        🔍 This system records all authentication attempts including
        <strong>IP address</strong>, <strong>device fingerprint</strong>,
        <strong>timestamp</strong>, and <strong>geolocation</strong>.
        Unauthorized access is reported to law enforcement.
      </div>

      <div class="user-portal-link">
        Not an administrator?
        <a routerLink="/login">← Participant portal login</a>
      </div>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  panel         = signal<AdminPanel>('credentials');
  loading       = signal(false);
  showPw        = signal(false);
  alert         = signal('');
  alertType     = signal<'ok'|'err'|'warn'>('warn');
  failedAttempts = signal(0);
  locked        = signal(false);
  lockTimer     = signal('05:00');
  lockProgress  = signal(100);
  clock         = signal('');
  mfaToken      = signal('');
  otpValues     = signal(['','','','','','']);

  private clockInterval?: any;
  private lockInterval?: any;

  sessionIp = `192.168.${Math.floor(Math.random()*254)+1}.${Math.floor(Math.random()*254)+1}`;

  credForm = this.fb.group({
    email:         ['', [Validators.required, Validators.email]],
    password:      ['', [Validators.required, Validators.minLength(6)]],
    rememberDevice: [false]
  });

  backupCodeControl = this.fb.control('', Validators.required);
  forgotEmailControl = this.fb.control('', [Validators.required, Validators.email]);

  get stepLabel(): () => string {
    return () => {
      const map: Record<AdminPanel, string> = {
        credentials: 'STEP 1 / 2 — CREDENTIALS',
        mfa:         'STEP 2 / 2 — 2FA VERIFICATION',
        backup:      'STEP 2 / 2 — BACKUP CODE',
        forgot:      'ACCOUNT RECOVERY'
      };
      return map[this.panel()];
    };
  }

  ngOnInit(): void {
    this.clockInterval = setInterval(() => {
      this.clock.set(new Date().toUTCString().split(' ')[4] + ' UTC');
    }, 1000);
    this.clock.set(new Date().toUTCString().split(' ')[4] + ' UTC');
    this.showAlert('// Demo: admin@agilepro.com / Admin@9876 — then enter any 6 digits for MFA', 'warn');
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
    clearInterval(this.lockInterval);
  }

  setPanel(p: AdminPanel): void {
    this.panel.set(p);
    this.alert.set('');
  }

  doLogin(): void {
    if (this.credForm.invalid) { this.credForm.markAllAsTouched(); return; }
    this.loading.set(true); this.alert.set('');

    this.auth.adminLogin(this.credForm.value as any).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success) {
          this.failedAttempts.update(n => n + 1);
          if (this.failedAttempts() >= 5) { this.triggerLockout(); return; }
          this.showAlert(`✗ Authentication failed. ${5 - this.failedAttempts()} attempt${5-this.failedAttempts() !== 1 ? 's' : ''} remaining.`, 'err');
        } else if (res.data?.mfaRequired) {
          this.mfaToken.set(res.data.mfaToken!);
          this.showAlert('✓ Credentials verified. Proceed with MFA.', 'ok');
          setTimeout(() => { this.alert.set(''); this.setPanel('mfa'); }, 800);
        } else {
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.failedAttempts.update(n => n + 1);
        if (this.failedAttempts() >= 5) { this.triggerLockout(); return; }
        this.showAlert(`✗ ${err.error?.message || 'Authentication failed'}`, 'err');
      }
    });
  }

  // OTP HANDLING
  onTotpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;
    const arr = [...this.otpValues()]; arr[index] = val; this.otpValues.set(arr);
    if (val) {
      if (index < 5) (document.getElementById(`totp-${index+1}`) as HTMLInputElement)?.focus();
      if (index === 5) this.verifyMfa();
    }
  }
  onTotpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value && index > 0)
      (document.getElementById(`totp-${index-1}`) as HTMLInputElement)?.focus();
  }

  verifyMfa(): void {
    const code = this.otpValues().join('');
    if (code.length < 6) { this.showAlert('⚠ Enter all 6 digits', 'err'); return; }
    this.loading.set(true);
    this.auth.verifyMfa({ mfaToken: this.mfaToken(), code }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) this.router.navigate(['/admin']);
        else { this.showAlert('✗ Invalid TOTP code. Check your authenticator app.', 'err'); this.resetOtp(); }
      },
      error: () => { this.loading.set(false); this.showAlert('✗ Verification failed', 'err'); this.resetOtp(); }
    });
  }

  verifyBackup(): void {
    const code = this.backupCodeControl.value;
    if (!code) { this.showAlert('⚠ Enter your backup code', 'err'); return; }
    this.loading.set(true);
    this.auth.verifyBackupCode(this.mfaToken(), code).subscribe({
      next: (res) => { this.loading.set(false); if (res.success) this.router.navigate(['/admin']); },
      error: () => { this.loading.set(false); this.showAlert('✗ Invalid backup code', 'err'); }
    });
  }

  forgotPassword(): void {
    const email = this.forgotEmailControl.value;
    if (!email) { this.showAlert('⚠ Enter your admin email', 'err'); return; }
    this.loading.set(true);
    this.auth.forgotPassword(email).subscribe({
      next: (res) => { this.loading.set(false); this.showAlert('✓ ' + res.message, 'ok'); },
      error: () => { this.loading.set(false); this.showAlert('Request failed', 'err'); }
    });
  }

  contactSupport(): void {
    this.showAlert('Contact security@agilepro.institute or your system administrator. Reference this incident.', 'warn');
    this.locked.set(false);
    clearInterval(this.lockInterval);
  }

  private triggerLockout(): void {
    this.locked.set(true);
    let s = 299;
    this.updateLock(s);
    this.lockInterval = setInterval(() => {
      s--;
      this.updateLock(s);
      if (s <= 0) {
        clearInterval(this.lockInterval);
        this.locked.set(false);
        this.failedAttempts.set(0);
        this.showAlert('⚠ Lockout expired. This incident has been reported.', 'warn');
      }
    }, 1000);
  }
  private updateLock(s: number): void {
    const m = String(Math.floor(s/60)).padStart(2,'0');
    const sec = String(s%60).padStart(2,'0');
    this.lockTimer.set(`${m}:${sec}`);
    this.lockProgress.set(s/299*100);
  }
  private resetOtp(): void {
    this.otpValues.set(['','','','','','']);
    document.querySelectorAll<HTMLInputElement>('.totp-cell').forEach(c => c.value = '');
    (document.getElementById('totp-0') as HTMLInputElement)?.focus();
  }
  private showAlert(msg: string, type: 'ok'|'err'|'warn'): void {
    this.alert.set(msg); this.alertType.set(type);
  }
}
