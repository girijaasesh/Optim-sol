import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService, RegistrationService } from '../../core/services/services';
import { AuthService } from '../../core/services/auth.service';
import { CourseDto } from '../../core/models/auth.models';

type Step = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="reg-page">
  <nav class="reg-nav">
    <a routerLink="/" class="brand"><div class="brand-mark">A</div><span>AgilePro Institute</span></a>
    <div class="step-trail">
      <div *ngFor="let s of [1,2,3,4]" class="step-dot"
        [class.active]="step() === s" [class.done]="step() > s">
        {{ step() > s ? '✓' : s }}
      </div>
    </div>
  </nav>

  <div class="reg-body">
    <!-- STEP 1: Choose Course -->
    <div *ngIf="step() === 1" class="reg-step">
      <div class="step-head">
        <div class="step-label">Step 1 of 4</div>
        <h2>Choose your <em>course</em></h2>
        <p>Select the SAFe certification that fits your role and goals.</p>
      </div>
      <div *ngIf="alert()" class="alert alert-err">{{ alert() }}</div>
      <div class="currency-row">
        <label>Show prices in</label>
        <select [(ngModel)]="selectedCurrency" (change)="loadCourses()" class="form-control" style="width:auto">
          <option *ngFor="let c of currencies" [value]="c.code">{{ c.symbol }} {{ c.code }}</option>
        </select>
      </div>
      <div *ngIf="coursesLoading()" class="courses-list">
        <div *ngFor="let s of [1,2,3]" class="course-row skeleton" style="height:80px"></div>
      </div>
      <div *ngIf="!coursesLoading()" class="courses-list">
        <div *ngFor="let c of courses()" class="course-row"
          [class.selected]="selectedCourse()?.id === c.id"
          [class.sold-out]="c.soldOut"
          (click)="!c.soldOut && selectCourse(c)">
          <div class="cr-main">
            <div class="cr-type">{{ formatType(c.certificationType) }}</div>
            <div class="cr-title">{{ c.title }}</div>
            <div class="cr-meta">
              <span>📅 {{ c.startDate | date:'mediumDate' }}</span>
              <span>⏱ {{ c.durationDays }}d</span>
              <span>{{ c.format === 'VIRTUAL' ? '💻 Virtual' : '🏢 In-Person' }}</span>
              <span class="seats" [class.low]="c.seatsRemaining <= 5">
                {{ c.soldOut ? '🔴 Sold Out' : c.seatsRemaining + ' seats' }}
              </span>
            </div>
          </div>
          <div class="cr-price">
            <div *ngIf="c.earlyBirdActive">
              <div class="price-orig">{{ c.price | currency:selectedCurrency }}</div>
              <div class="price-now">{{ c.effectivePrice | currency:selectedCurrency }}</div>
              <div class="price-tag">Early Bird</div>
            </div>
            <div *ngIf="!c.earlyBirdActive" class="price-now">{{ c.effectivePrice | currency:selectedCurrency }}</div>
          </div>
        </div>
      </div>
      <div style="text-align:right;margin-top:1.5rem">
        <button class="btn btn-primary" (click)="next()" [disabled]="!selectedCourse()">
          Continue →
        </button>
      </div>
    </div>

    <!-- STEP 2: Personal Details -->
    <div *ngIf="step() === 2" class="reg-step">
      <div class="step-head">
        <div class="step-label">Step 2 of 4</div>
        <h2>Your <em>details</em></h2>
        <p>We'll use this for your certificate and invoice.</p>
      </div>
      <div *ngIf="!auth.isLoggedIn()" class="auth-nudge">
        <span>Already registered?</span>
        <a routerLink="/login" [queryParams]="{returnUrl: '/register'}">Sign in to auto-fill →</a>
      </div>
      <form [formGroup]="detailsForm" class="form-grid">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input formControlName="fullName" class="form-control" placeholder="Jane Smith">
          <div class="form-error" *ngIf="df['fullName'].invalid && df['fullName'].touched">Required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input formControlName="email" type="email" class="form-control" placeholder="jane@company.com">
          <div class="form-error" *ngIf="df['email'].invalid && df['email'].touched">Valid email required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Company / Organisation</label>
          <input formControlName="company" class="form-control" placeholder="Acme Corp">
        </div>
        <div class="form-group">
          <label class="form-label">Job Title</label>
          <input formControlName="jobTitle" class="form-control" placeholder="Scrum Master">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input formControlName="phone" class="form-control" placeholder="+61 400 000 000">
        </div>
        <div class="form-group">
          <label class="form-label">Country</label>
          <select formControlName="country" class="form-control">
            <option value="">Select country</option>
            <option *ngFor="let c of countries" [value]="c">{{ c }}</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Experience Level</label>
          <select formControlName="experienceLevel" class="form-control">
            <option value="">Select level</option>
            <option value="beginner">Beginner (new to agile)</option>
            <option value="intermediate">Intermediate (1-3 years)</option>
            <option value="advanced">Advanced (3+ years)</option>
            <option value="expert">Expert (team lead / coach)</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">GST / VAT Number (optional, for invoicing)</label>
          <input formControlName="gstNumber" class="form-control" placeholder="e.g. AU12345678">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Special Accommodations</label>
          <textarea formControlName="specialAccommodations" class="form-control" rows="2"
            placeholder="Accessibility needs, dietary requirements, etc."></textarea>
        </div>
      </form>
      <div class="step-actions">
        <button class="btn btn-outline" (click)="back()">← Back</button>
        <button class="btn btn-primary" (click)="next()" [disabled]="detailsForm.invalid">Continue →</button>
      </div>
    </div>

    <!-- STEP 3: Review & Coupon -->
    <div *ngIf="step() === 3" class="reg-step">
      <div class="step-head">
        <div class="step-label">Step 3 of 4</div>
        <h2>Review & <em>payment</em></h2>
      </div>
      <div class="order-card">
        <div class="oc-row"><span>Course</span><strong>{{ selectedCourse()?.title }}</strong></div>
        <div class="oc-row"><span>Date</span><span>{{ selectedCourse()?.startDate | date:'longDate' }}</span></div>
        <div class="oc-row"><span>Format</span><span>{{ selectedCourse()?.format }}</span></div>
        <div class="oc-row"><span>Attendee</span><span>{{ detailsForm.value.fullName }}</span></div>
        <div class="oc-divider"></div>
        <div class="oc-row"><span>Base price</span><span>{{ selectedCourse()?.effectivePrice | currency:selectedCurrency }}</span></div>
        <div *ngIf="couponResult()?.valid" class="oc-row discount">
          <span>Discount ({{ couponResult()?.couponCode }})</span>
          <span>− {{ couponResult()?.discountAmount | currency:selectedCurrency }}</span>
        </div>
        <div class="oc-row total">
          <span>Total</span>
          <strong>{{ finalPrice() | currency:selectedCurrency }}</strong>
        </div>
      </div>

      <div class="coupon-row">
        <input class="form-control" [(ngModel)]="couponCode" placeholder="Have a coupon code?">
        <button class="btn btn-outline btn-sm" (click)="applyCoupon()" [disabled]="couponLoading()">
          {{ couponLoading() ? 'Checking…' : 'Apply' }}
        </button>
      </div>
      <div *ngIf="couponResult()" class="coupon-result" [class.valid]="couponResult()?.valid">
        {{ couponResult()?.message }}
      </div>

      <div class="step-actions">
        <button class="btn btn-outline" (click)="back()">← Back</button>
        <button class="btn btn-primary" (click)="submitRegistration()" [disabled]="loading()">
          <span *ngIf="!loading()">Proceed to Payment →</span>
          <span *ngIf="loading()" class="spinner-sm"></span>
        </button>
      </div>
    </div>

    <!-- STEP 4: Confirmation -->
    <div *ngIf="step() === 4" class="reg-step confirmation">
      <div class="confirm-icon">🎉</div>
      <h2>Registration <em>submitted!</em></h2>
      <p>Your registration reference is <strong>{{ regRef() }}</strong></p>
      <p>Complete your payment to lock in your spot. Check your email for next steps.</p>
      <div class="confirm-actions">
        <a *ngIf="auth.isLoggedIn()" routerLink="/portal/my-courses" class="btn btn-primary">View My Courses →</a>
        <a *ngIf="!auth.isLoggedIn()" routerLink="/login" class="btn btn-primary">Sign In to View →</a>
        <a routerLink="/" class="btn btn-outline">Back to Home</a>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.reg-page { min-height:100vh; background:var(--cream); }
.reg-nav { background:white; border-bottom:1px solid var(--border); padding:1rem 2rem; display:flex; align-items:center; justify-content:space-between; }
.brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--ink); }
.brand-mark { width:36px;height:36px;background:var(--amber);border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Lora',serif;font-weight:700;color:white; }
.brand span { font-family:'Lora',serif;font-weight:700;font-size:1rem; }
.step-trail { display:flex; gap:8px; align-items:center; }
.step-dot { width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;background:var(--cream-mid);color:var(--ink-light); &.active{background:var(--ink);color:white;} &.done{background:var(--green);color:white;} }

.reg-body { max-width:760px; margin:0 auto; padding:3rem 2rem; }
.reg-step { animation: fadeUp 0.35s ease; }
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

.step-head { margin-bottom:2rem; .step-label{font-size:0.75rem;font-weight:600;color:var(--teal);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.5rem;} h2{font-family:'Lora',serif;font-size:2rem;font-weight:700; em{color:var(--teal);font-style:italic;}} p{color:var(--ink-mid);margin-top:0.25rem;} }

.currency-row { display:flex; align-items:center; gap:10px; margin-bottom:1rem; font-size:0.82rem; color:var(--ink-mid); }
.courses-list { display:flex; flex-direction:column; gap:10px; }
.course-row { display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.25rem;background:white;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:all 0.15s; }
.course-row:hover { border-color:var(--teal); }
.course-row.selected { border-color:var(--teal);background:var(--teal-light);box-shadow:0 0 0 3px var(--teal-glow); }
.course-row.sold-out { opacity:0.5;cursor:default; }
.course-row.skeleton { background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.cr-main { flex:1; }
.cr-type { font-size:0.7rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px; }
.cr-title { font-weight:600;color:var(--ink);margin-bottom:6px; }
.cr-meta { display:flex;flex-wrap:wrap;gap:0.75rem;font-size:0.75rem;color:var(--ink-mid); .seats{font-weight:600;color:var(--green);} .low{color:var(--red);} }
.cr-price { text-align:right;flex-shrink:0; }
.price-orig { font-size:0.8rem;color:var(--ink-light);text-decoration:line-through; }
.price-now { font-size:1.1rem;font-weight:700;color:var(--ink); }
.price-tag { font-size:0.68rem;color:var(--amber);font-weight:700; }

.auth-nudge { background:var(--teal-light);border:1px solid rgba(42,124,132,0.2);border-radius:8px;padding:0.75rem 1rem;font-size:0.82rem;color:var(--teal);margin-bottom:1.5rem; a{color:var(--teal);font-weight:600;} }
.form-grid { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }

.order-card { background:white;border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1.25rem; }
.oc-row { display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;font-size:0.875rem; span:first-child{color:var(--ink-mid);} }
.oc-row.discount { color:var(--green); span:last-child{font-weight:600;} }
.oc-row.total { border-top:2px solid var(--border);margin-top:8px;padding-top:12px;font-size:1rem; strong{font-size:1.15rem;} }
.oc-divider { height:1px;background:var(--border);margin:4px 0; }

.coupon-row { display:flex;gap:8px;margin-bottom:0.5rem; .form-control{flex:1;} }
.coupon-result { font-size:0.8rem;padding:0.5rem 0.75rem;border-radius:6px;background:#fef2f2;color:var(--red); &.valid{background:#f0fdf4;color:var(--green);} }

.step-actions { display:flex;justify-content:space-between;margin-top:2rem; }

.confirmation { text-align:center;padding:3rem 0; .confirm-icon{font-size:4rem;margin-bottom:1rem;} h2{font-family:'Lora',serif;font-size:2rem;font-weight:700; em{color:var(--teal);font-style:italic;}} p{color:var(--ink-mid);margin:0.5rem 0;} }
.confirm-actions { display:flex;gap:1rem;justify-content:center;margin-top:2rem; }
.alert-err { background:#fef2f2;color:#991b1b;border:1px solid #fecaca;border-radius:8px;padding:0.75rem 1rem;font-size:0.82rem;margin-bottom:1rem; }
`]
})
export class RegisterComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  auth                = inject(AuthService);
  private courseService = inject(CourseService);
  private regService  = inject(RegistrationService);

  step          = signal<Step>(1);
  courses       = signal<CourseDto[]>([]);
  selectedCourse = signal<CourseDto | null>(null);
  coursesLoading = signal(true);
  loading       = signal(false);
  couponLoading = signal(false);
  alert         = signal('');
  regRef        = signal('');
  couponCode    = '';
  couponResult  = signal<any>(null);
  selectedCurrency = 'USD';

  currencies = [
    { code:'USD', symbol:'$' },{ code:'AUD', symbol:'A$' },
    { code:'GBP', symbol:'£' },{ code:'CAD', symbol:'C$' },
    { code:'INR', symbol:'₹' },{ code:'EUR', symbol:'€' },
  ];

  countries = ['Australia','Canada','India','New Zealand','Singapore',
               'United Kingdom','United States','Other'];

  detailsForm = this.fb.group({
    fullName:             ['', Validators.required],
    email:                ['', [Validators.required, Validators.email]],
    company:              [''],
    jobTitle:             [''],
    phone:                [''],
    country:              [''],
    experienceLevel:      [''],
    gstNumber:            [''],
    specialAccommodations:[''],
  });
  get df() { return this.detailsForm.controls; }

  ngOnInit() {
    // Pre-fill from logged in user
    const user = this.auth.currentUser();
    if (user) {
      this.detailsForm.patchValue({
        fullName: user.fullName, email: user.email,
        company: user.company || '', country: user.country || ''
      });
      this.selectedCurrency = user.preferredCurrency || 'USD';
    }
    this.loadCourses();
    // Pre-select from query param
    this.route.queryParams.subscribe(p => {
      if (p['courseId']) {
        this.courses().find(c => c.id == p['courseId']) &&
          this.selectedCourse.set(this.courses().find(c => c.id == p['courseId'])!);
      }
    });
  }

  loadCourses() {
    this.coursesLoading.set(true);
    this.courseService.getPublicCourses(undefined, this.selectedCurrency).subscribe({
      next: res => { this.courses.set(res.data || []); this.coursesLoading.set(false); },
      error: () => this.coursesLoading.set(false)
    });
  }

  selectCourse(c: CourseDto) { this.selectedCourse.set(c); }

  next() {
    if (this.step() === 1 && !this.selectedCourse()) return;
    if (this.step() === 2) { this.detailsForm.markAllAsTouched(); if (this.detailsForm.invalid) return; }
    this.step.update(s => (s + 1) as Step);
    window.scrollTo(0, 0);
  }

  back() { this.step.update(s => (s - 1) as Step); window.scrollTo(0, 0); }

  applyCoupon() {
    if (!this.couponCode || !this.selectedCourse()) return;
    this.couponLoading.set(true);
    this.regService.validateCoupon(this.couponCode, this.selectedCourse()!.id, this.selectedCurrency)
      .subscribe({
        next: res => {
          this.couponLoading.set(false);
          this.couponResult.set(res.data ? { ...res.data, couponCode: this.couponCode } : null);
        },
        error: () => { this.couponLoading.set(false); }
      });
  }

  finalPrice(): number {
    const base = this.selectedCourse()?.effectivePrice || 0;
    const discount = this.couponResult()?.valid ? (this.couponResult()?.discountAmount || 0) : 0;
    return Math.max(0, base - discount);
  }

  submitRegistration() {
    this.loading.set(true);
    const req = {
      courseId: this.selectedCourse()!.id,
      currency: this.selectedCurrency,
      couponCode: this.couponResult()?.valid ? this.couponCode : null,
      specialAccommodations: this.detailsForm.value.specialAccommodations,
      gstNumber: this.detailsForm.value.gstNumber,
      experienceLevel: this.detailsForm.value.experienceLevel,
    };
    this.regService.createRegistration(req).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.regRef.set(res.data?.registrationRef || 'REG-PENDING');
          this.step.set(4);
        } else {
          this.alert.set(res.message);
        }
      },
      error: err => {
        this.loading.set(false);
        this.alert.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  formatType(t: string) { return t.replace(/_/g,' ').replace('SAFE','SAFe'); }
}
