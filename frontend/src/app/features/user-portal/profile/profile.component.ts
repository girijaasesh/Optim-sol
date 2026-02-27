import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="profile-page">
  <div class="page-header">
    <h1>My Profile</h1>
    <p>Your personal information and preferences</p>
  </div>

  <div class="profile-layout">
    <!-- AVATAR CARD -->
    <div class="avatar-card card">
      <div class="big-avatar">{{ initials() }}</div>
      <div class="avatar-name">{{ auth.currentUser()?.fullName }}</div>
      <div class="avatar-email">{{ auth.currentUser()?.email }}</div>
      <div class="avatar-badges">
        <span class="badge badge-teal">{{ auth.currentUser()?.role }}</span>
        <span class="badge badge-green" *ngIf="auth.currentUser()?.emailVerified">✓ Verified</span>
        <span class="badge badge-amber" *ngIf="auth.currentUser()?.mfaEnabled">🔒 MFA On</span>
      </div>
      <div class="avatar-provider" *ngIf="auth.currentUser()?.provider !== 'LOCAL'">
        <span>Signed in with {{ auth.currentUser()?.provider }}</span>
      </div>
    </div>

    <!-- PROFILE FORM -->
    <div class="profile-form card">
      <div class="card-header">
        <h3>Personal Details</h3>
        <button class="btn btn-outline btn-sm" *ngIf="!editing()" (click)="editing.set(true)">Edit</button>
        <button class="btn btn-outline btn-sm text-red" *ngIf="editing()" (click)="cancel()">Cancel</button>
      </div>
      <div class="card-body">
        <div *ngIf="msg()" class="alert" [class]="msgType()==='ok'?'alert-ok':'alert-err'">{{ msg() }}</div>
        <form [formGroup]="form" class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input formControlName="fullName" class="form-control" [readonly]="!editing()">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input formControlName="email" class="form-control" readonly>
            <div class="form-hint">Email cannot be changed</div>
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input formControlName="phone" class="form-control" [readonly]="!editing()" placeholder="Your phone number">
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input formControlName="company" class="form-control" [readonly]="!editing()" placeholder="Your organisation">
          </div>
          <div class="form-group">
            <label class="form-label">Job Title</label>
            <input formControlName="jobTitle" class="form-control" [readonly]="!editing()" placeholder="e.g. Scrum Master">
          </div>
          <div class="form-group">
            <label class="form-label">Country</label>
            <select formControlName="country" class="form-control" [attr.disabled]="!editing() ? '' : null">
              <option value="">Select country</option>
              <option *ngFor="let c of countries" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Currency</label>
            <select formControlName="preferredCurrency" class="form-control" [attr.disabled]="!editing() ? '' : null">
              <option *ngFor="let c of currencies" [value]="c.code">{{ c.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">GST / VAT Number</label>
            <input formControlName="gstNumber" class="form-control" [readonly]="!editing()" placeholder="For invoicing">
          </div>
        </form>
        <div *ngIf="editing()" class="form-actions">
          <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.profile-page { max-width:900px; }
.page-header { margin-bottom:2rem; h1{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
.profile-layout { display:grid;grid-template-columns:220px 1fr;gap:1.5rem;align-items:start; }
.card { background:white;border:1px solid var(--border);border-radius:var(--radius); }
.avatar-card { padding:2rem 1.25rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:0.75rem; }
.big-avatar { width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--teal),#1a5c63);color:white;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700; }
.avatar-name { font-weight:700;font-size:1rem;color:var(--ink); }
.avatar-email { font-size:0.78rem;color:var(--ink-light);word-break:break-all; }
.avatar-badges { display:flex;flex-wrap:wrap;gap:4px;justify-content:center; }
.badge { display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.65rem;font-weight:700; }
.badge-teal { background:var(--teal-light);color:var(--teal); }
.badge-green { background:#dcfce7;color:#166534; }
.badge-amber { background:#fef9c3;color:#854d0e; }
.avatar-provider { font-size:0.72rem;color:var(--ink-light); }
.card-header { display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border); h3{font-family:'Lora',serif;font-size:1rem;font-weight:700;} }
.card-body { padding:1.5rem; }
.form-grid { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
.form-hint { font-size:0.72rem;color:var(--ink-light);margin-top:3px; }
.form-actions { margin-top:1.5rem;display:flex;justify-content:flex-end; }
.alert { padding:0.75rem 1rem;border-radius:8px;font-size:0.82rem;margin-bottom:1rem; }
.alert-ok { background:#f0fdf4;color:#166534;border:1px solid #bbf7d0; }
.alert-err { background:#fef2f2;color:#991b1b;border:1px solid #fecaca; }
.text-red { color:var(--red); }
@media(max-width:600px) { .profile-layout{grid-template-columns:1fr;} .form-grid{grid-template-columns:1fr;} }
`]
})
export class ProfileComponent implements OnInit {
  auth    = inject(AuthService);
  private fb = inject(FormBuilder);

  editing = signal(false);
  saving  = signal(false);
  msg     = signal('');
  msgType = signal<'ok'|'err'>('ok');

  countries = ['Australia','Canada','India','New Zealand','Singapore','United Kingdom','United States','Other'];
  currencies = [
    {code:'USD',label:'USD — US Dollar'},
    {code:'AUD',label:'AUD — Australian Dollar'},
    {code:'GBP',label:'GBP — British Pound'},
    {code:'CAD',label:'CAD — Canadian Dollar'},
    {code:'INR',label:'INR — Indian Rupee'},
    {code:'EUR',label:'EUR — Euro'},
    {code:'SGD',label:'SGD — Singapore Dollar'},
  ];

  form = this.fb.group({
    fullName:         ['', Validators.required],
    email:            [{value:'', disabled:true}],
    phone:            [''],
    company:          [''],
    jobTitle:         [''],
    country:          [''],
    preferredCurrency:['USD'],
    gstNumber:        [''],
  });

  ngOnInit() {
    const u = this.auth.currentUser();
    if (u) {
      this.form.patchValue({
        fullName: u.fullName, email: u.email,
        company: u.company || '', jobTitle: u.jobTitle || '',
        country: u.country || '', preferredCurrency: u.preferredCurrency || 'USD',
      });
    }
  }

  save() {
    this.saving.set(true);
    // TODO: call UserService.updateProfile
    setTimeout(() => {
      this.saving.set(false);
      this.msg.set('Profile updated successfully');
      this.msgType.set('ok');
      this.editing.set(false);
    }, 800);
  }

  cancel() { this.editing.set(false); this.ngOnInit(); }

  initials(): string {
    return this.auth.currentUser()?.fullName?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'ME';
  }
}
