// src/app/features/auth/user-login/user-login.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type Panel = 'login' | 'register' | 'forgot' | 'mfa';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="auth-page">
  <!-- LEFT PANEL -->
  <div class="auth-left">
    <div class="brand" routerLink="/">
      <div class="brand-mark">A</div>
      <span class="brand-name">AgilePro Institute</span>
    </div>
    <div class="auth-pitch">
      <div class="eyebrow">Participant Portal</div>
      <h1>Your <em>learning journey</em>,<br>all in one place.</h1>
      <p>Access courses, download certificates, and track your SAFe certification pathway.</p>
      <div class="feature-list">
        <div class="feature-item" *ngFor="let f of features">
          <span class="feature-icon">{{f.icon}}</span>
          <div><strong>{{f.title}}</strong><span>{{f.desc}}</span></div>
        </div>
      </div>
    </div>
    <div class="trust-row">
      <span class="trust-item">🔒 TLS 256-bit</span>
      <span class="trust-item">🛡 GDPR Ready</span>
      <span class="trust-item">✅ SOC 2</span>
    </div>
  </div>

  <!-- RIGHT PANEL -->
  <div class="auth-right">
    <div class="auth-card">

      <!-- ── LOGIN PANEL ── -->
      <div *ngIf="panel() === 'login'" class="panel-body">
        <div class="card-top">
          <div class="greeting">Welcome back</div>
          <h2 class="card-title">Sign <span>in</span></h2>
          <p class="card-sub">Access your courses, certificates and learning materials.</p>
        </div>

        <div *ngIf="alert()" class="alert" [class]="'alert-' + alertType()">
          <span>{{alert()}}</span>
        </div>

        <!-- GOOGLE BUTTON -->
        <button class="google-btn" (click)="googleLogin()" [disabled]="googleLoading()">
          <svg class="g-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span *ngIf="!googleLoading()">Continue with Google</span>
          <span *ngIf="googleLoading()">Connecting to Google…</span>
        </button>

        <div class="sso-row">
          <button class="sso-mini" (click)="ssoLogin('Microsoft')">Ⓜ️ Microsoft</button>
          <button class="sso-mini" (click)="ssoLogin('LinkedIn')">🔗 LinkedIn</button>
          <button class="sso-mini" (click)="ssoLogin('Okta')">🔐 Okta</button>
        </div>

        <div class="or-divider"><span>or sign in with email</span></div>

        <form [formGroup]="loginForm" (ngSubmit)="login()">
          <div class="form-group">
            <label>Email</label>
            <div class="input-wrap">
              <input formControlName="email" type="email" placeholder="you@company.com"
                [class.input-err]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <span class="input-icon">
                {{loginForm.get('email')?.valid && loginForm.get('email')?.value ? '✅' : '✉️'}}
              </span>
            </div>
            <div class="field-err" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              Enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label class="label-row">
              <span>Password</span>
              <a (click)="setPanel('forgot')">Forgot?</a>
            </label>
            <div class="input-wrap">
              <input [type]="showPw() ? 'text' : 'password'" formControlName="password"
                placeholder="••••••••••" autocomplete="current-password"
                [class.input-err]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <button type="button" class="input-icon btn-icon" (click)="showPw.set(!showPw())">
                {{showPw() ? '🙈' : '👁'}}
              </button>
            </div>
          </div>

          <label class="remember-row">
            <input type="checkbox" formControlName="rememberMe"> Stay signed in for 7 days
          </label>

          <button type="submit" class="submit-btn" [disabled]="loading()">
            <span *ngIf="!loading()">Sign In</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </form>

        <div class="card-footer">
          <p>New here? <a (click)="setPanel('register')">Create an account</a></p>
          <a class="admin-link" routerLink="/admin/login">Admin login →</a>
        </div>
      </div>

      <!-- ── MFA PANEL ── -->
      <div *ngIf="panel() === 'mfa'" class="panel-body">
        <div class="card-top">
          <h2 class="card-title">Verify <span>identity</span></h2>
          <p class="card-sub">{{mfaSubtext()}}</p>
        </div>
        <div *ngIf="alert()" class="alert" [class]="'alert-' + alertType()">{{alert()}}</div>

        <div class="otp-container">
          <div class="otp-row">
            <input *ngFor="let i of [0,1,2,3,4,5]"
              class="otp-input" maxlength="1" inputmode="numeric" type="text"
              [id]="'otp-' + i"
              (input)="onOtpInput($event, i)"
              (keydown)="onOtpKeydown($event, i)">
          </div>
          <p class="otp-hint">Didn't receive it? <a (click)="resendOtp()">Resend</a> · <a (click)="setPanel('login')">Cancel</a></p>
        </div>

        <button class="submit-btn" (click)="verifyMfa()" [disabled]="loading()">
          <span *ngIf="!loading()">Verify & Sign In</span>
          <span *ngIf="loading()" class="spinner"></span>
        </button>
      </div>

      <!-- ── FORGOT PANEL ── -->
      <div *ngIf="panel() === 'forgot'" class="panel-body">
        <div class="card-top">
          <h2 class="card-title">Reset <span>password</span></h2>
          <p class="card-sub">We'll email you a secure reset link.</p>
        </div>
        <div *ngIf="alert()" class="alert" [class]="'alert-' + alertType()">{{alert()}}</div>
        <form [formGroup]="forgotForm" (ngSubmit)="forgotPassword()">
          <div class="form-group">
            <label>Your Email</label>
            <div class="input-wrap">
              <input formControlName="email" type="email" placeholder="you@company.com">
              <span class="input-icon">✉️</span>
            </div>
          </div>
          <button type="submit" class="submit-btn" [disabled]="loading()">
            <span *ngIf="!loading()">Send Reset Link</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </form>
        <div class="card-footer"><a (click)="setPanel('login')">← Back to sign in</a></div>
      </div>

      <!-- ── REGISTER PANEL ── -->
      <div *ngIf="panel() === 'register'" class="panel-body">
        <div class="card-top">
          <h2 class="card-title">Create <span>account</span></h2>
          <p class="card-sub">Register once, access all your courses and certificates.</p>
        </div>

        <button class="google-btn" (click)="googleLogin()">
          <svg class="g-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>
        <div class="or-divider"><span>or register with email</span></div>

        <div *ngIf="alert()" class="alert" [class]="'alert-' + alertType()">{{alert()}}</div>

        <form [formGroup]="registerForm" (ngSubmit)="register()">
          <div class="form-group">
            <label>Full Name</label>
            <div class="input-wrap"><input formControlName="fullName" type="text" placeholder="Jane Smith"><span class="input-icon">👤</span></div>
            <div class="field-err" *ngIf="regF['fullName'].invalid && regF['fullName'].touched">Full name required (min 2 chars)</div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <div class="input-wrap"><input formControlName="email" type="email" placeholder="jane@company.com"><span class="input-icon">✉️</span></div>
            <div class="field-err" *ngIf="regF['email'].invalid && regF['email'].touched">Valid email required</div>
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="input-wrap">
              <input [type]="showRegPw() ? 'text' : 'password'" formControlName="password"
                placeholder="Min 8 chars" (input)="updateStrength()">
              <button type="button" class="input-icon btn-icon" (click)="showRegPw.set(!showRegPw())">{{showRegPw() ? '🙈' : '👁'}}</button>
            </div>
            <div class="strength-meter" *ngIf="registerForm.get('password')?.value">
              <div class="strength-bars">
                <div class="s-bar" *ngFor="let b of [0,1,2,3]" [class]="getStrengthClass(b)"></div>
              </div>
              <div class="strength-label">{{strengthLabel()}}</div>
            </div>
            <div class="field-err" *ngIf="regF['password'].invalid && regF['password'].touched">Min 8 chars with uppercase, number & symbol</div>
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <div class="input-wrap">
              <input [type]="showRegPw() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Repeat password">
              <span class="input-icon">🔒</span>
            </div>
            <div class="field-err" *ngIf="regF['confirmPassword'].errors?.['mismatch'] && regF['confirmPassword'].touched">Passwords do not match</div>
          </div>
          <label class="remember-row">
            <input type="checkbox" formControlName="termsAccepted">
            I agree to the <a href="#" class="text-link">Terms</a> and <a href="#" class="text-link">Privacy Policy</a>
          </label>
          <div class="field-err" *ngIf="regF['termsAccepted'].invalid && registerForm.touched">You must accept the terms</div>

          <button type="submit" class="submit-btn" [disabled]="loading()">
            <span *ngIf="!loading()">Create Account</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </form>
        <div class="card-footer"><p>Already have an account? <a (click)="setPanel('login')">Sign in</a></p></div>
      </div>

    </div>
  </div>
</div>
  `,
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  panel        = signal<Panel>('login');
  loading      = signal(false);
  googleLoading = signal(false);
  showPw       = signal(false);
  showRegPw    = signal(false);
  alert        = signal('');
  alertType    = signal<'err'|'ok'|'info'>('info');
  mfaToken     = signal('');
  mfaSubtext   = signal('Enter the 6-digit code sent to your email');
  strengthScore = signal(0);
  strengthLabel = signal('');

  features = [
    { icon: '🗓', title: 'Upcoming Sessions', desc: 'Dates, Zoom links and pre-work for every course' },
    { icon: '🏆', title: 'Certificates & Badges', desc: 'Download verified SAFe certificates instantly' },
    { icon: '📚', title: 'Course Materials', desc: 'Study guides and reference materials' },
    { icon: '💳', title: 'Invoices & History', desc: 'All receipts for expense reporting' },
  ];

  loginForm = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  registerForm = this.fb.group({
    fullName:        ['', [Validators.required, Validators.minLength(2)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8),
                           Validators.pattern('^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$')]],
    confirmPassword: ['', Validators.required],
    termsAccepted:   [false, Validators.requiredTrue]
  }, { validators: this.passwordMatchValidator });

  get regF() { return this.registerForm.controls; }

  private returnUrl = '/portal';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/portal';
    const panel = this.route.snapshot.queryParams['panel'];
    if (panel) this.panel.set(panel as Panel);
  }

  setPanel(p: Panel): void {
    this.panel.set(p);
    this.alert.set('');
  }

  // ── LOGIN ──────────────────────────────────────────────────────
  login(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading.set(true); this.alert.set('');

    this.auth.login(this.loginForm.value as any).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success) { this.showAlert(res.message, 'err'); return; }
        if (res.data?.mfaRequired) {
          this.mfaToken.set(res.data.mfaToken!);
          this.mfaSubtext.set(`Code sent to ${this.loginForm.value.email!.replace(/(.{2}).*(@.*)/, '$1•••$2')}`);
          this.setPanel('mfa');
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.showAlert(err.error?.message || 'Login failed. Please check your credentials.', 'err');
      }
    });
  }

  // ── GOOGLE ────────────────────────────────────────────────────
  googleLogin(): void {
    this.googleLoading.set(true);
    this.auth.initiateGoogleLogin();
  }

  ssoLogin(provider: string): void {
    this.showAlert(`${provider} SSO requires configuration in your auth settings.`, 'info');
  }

  // ── MFA ───────────────────────────────────────────────────────
  otpValue = signal<string[]>(['', '', '', '', '', '']);

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;
    const arr = [...this.otpValue()];
    arr[index] = val;
    this.otpValue.set(arr);
    if (val && index < 5) {
      (document.getElementById(`otp-${index + 1}`) as HTMLInputElement)?.focus();
    }
    if (index === 5 && val) this.verifyMfa();
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value && index > 0) {
      (document.getElementById(`otp-${index - 1}`) as HTMLInputElement)?.focus();
    }
  }

  verifyMfa(): void {
    const code = this.otpValue().join('');
    if (code.length < 6) { this.showAlert('Enter all 6 digits', 'err'); return; }
    this.loading.set(true);
    this.auth.verifyMfa({ mfaToken: this.mfaToken(), code }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) this.router.navigateByUrl(this.returnUrl);
        else this.showAlert(res.message, 'err');
      },
      error: () => { this.loading.set(false); this.showAlert('Verification failed', 'err'); }
    });
  }

  resendOtp(): void {
    this.showAlert('New code sent to your email.', 'ok');
    this.otpValue.set(['', '', '', '', '', '']);
  }

  // ── FORGOT ────────────────────────────────────────────────────
  forgotPassword(): void {
    if (this.forgotForm.invalid) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.forgotForm.value.email!).subscribe({
      next: (res) => { this.loading.set(false); this.showAlert(res.message, 'ok'); },
      error: () => { this.loading.set(false); this.showAlert('Request failed. Try again.', 'err'); }
    });
  }

  // ── REGISTER ──────────────────────────────────────────────────
  register(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.loading.set(true);
    const { confirmPassword, ...req } = this.registerForm.value;
    this.auth.register(req as any).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.showAlert('Account created! Please verify your email, then sign in.', 'ok');
          setTimeout(() => this.setPanel('login'), 2500);
        } else { this.showAlert(res.message, 'err'); }
      },
      error: (err) => { this.loading.set(false); this.showAlert(err.error?.message || 'Registration failed', 'err'); }
    });
  }

  // ── PASSWORD STRENGTH ─────────────────────────────────────────
  updateStrength(): void {
    const pw = this.registerForm.get('password')?.value || '';
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    this.strengthScore.set(score);
    this.strengthLabel.set(['', 'Weak', 'Fair', 'Good', 'Strong ✓'][score] || '');
  }

  getStrengthClass(barIndex: number): string {
    const score = this.strengthScore();
    if (barIndex >= score) return 's-bar-empty';
    const cls = ['', 's-weak', 's-fair', 's-good', 's-strong'];
    return cls[score] || '';
  }

  // ── HELPERS ───────────────────────────────────────────────────
  private showAlert(msg: string, type: 'err'|'ok'|'info'): void {
    this.alert.set(msg);
    this.alertType.set(type);
  }

  private passwordMatchValidator(form: AbstractControl) {
    const pw  = form.get('password')?.value;
    const cpw = form.get('confirmPassword');
    if (pw !== cpw?.value) { cpw?.setErrors({ mismatch: true }); return { mismatch: true }; }
    else { cpw?.setErrors(null); return null; }
  }
}
