import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/services';
import { CourseDto } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="home">
  <!-- NAV -->
  <nav class="nav">
    <div class="nav-inner">
      <a class="brand" routerLink="/">
        <div class="brand-mark">A</div>
        <span>AgilePro Institute</span>
      </a>
      <div class="nav-links">
        <a routerLink="/certifications">Certifications</a>
        <a routerLink="/register">Register</a>
        <a *ngIf="!auth.isLoggedIn()" routerLink="/login" class="btn btn-primary btn-sm">Sign In</a>
        <a *ngIf="auth.isLoggedIn() && !auth.isAdmin()" routerLink="/portal" class="btn btn-primary btn-sm">My Portal</a>
        <a *ngIf="auth.isAdmin()" routerLink="/admin" class="btn btn-primary btn-sm">Dashboard</a>
      </div>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-eyebrow">✦ Scaled Agile Framework Training</div>
      <h1 class="hero-title">Certify your <em>agile</em><br>leadership today</h1>
      <p class="hero-sub">
        SAFe® certified courses led by expert practitioners.
        Virtual and in-person, from Agilist to SPC.
      </p>
      <div class="hero-ctas">
        <a routerLink="/certifications" class="btn btn-primary btn-lg">View Upcoming Courses</a>
        <a routerLink="/register" class="btn btn-outline btn-lg">Register Now</a>
      </div>
      <div class="hero-stats">
        <div class="stat"><strong>2,400+</strong><span>Certified professionals</span></div>
        <div class="stat"><strong>18</strong><span>Courses per year</span></div>
        <div class="stat"><strong>96%</strong><span>Satisfaction rate</span></div>
      </div>
    </div>
  </section>

  <!-- UPCOMING COURSES -->
  <section class="section">
    <div class="container">
      <div class="section-head">
        <h2>Upcoming <em>Sessions</em></h2>
        <p>Reserve your place before seats fill up</p>
      </div>
      <div *ngIf="loading()" class="courses-grid">
        <div *ngFor="let s of [1,2,3]" class="course-card skeleton"></div>
      </div>
      <div *ngIf="!loading()" class="courses-grid">
        <div *ngFor="let c of courses()" class="course-card">
          <div class="course-card-top">
            <div class="course-badge">{{ formatType(c.certificationType) }}</div>
            <div class="course-seats" [class.seats-low]="c.seatsRemaining <= 5">
              {{ c.seatsRemaining === 0 ? '🔴 Sold Out' : c.seatsRemaining + ' seats left' }}
            </div>
          </div>
          <h3 class="course-title">{{ c.title }}</h3>
          <div class="course-meta">
            <span>📅 {{ c.startDate | date:'mediumDate' }}</span>
            <span>⏱ {{ c.durationDays }} days</span>
            <span>{{ c.format === 'VIRTUAL' ? '💻 Virtual' : '🏢 In-Person' }}</span>
          </div>
          <div class="course-price">
            <div *ngIf="c.earlyBirdActive" class="price-eb">
              <span class="price-orig">{{ c.price | currency }}</span>
              <span class="price-now">{{ c.effectivePrice | currency }} Early Bird</span>
            </div>
            <div *ngIf="!c.earlyBirdActive" class="price-now">{{ c.effectivePrice | currency }}</div>
          </div>
          <a [routerLink]="['/register']" [queryParams]="{courseId: c.id}"
            class="btn btn-primary" style="width:100%;justify-content:center;"
            [class.btn-outline]="c.soldOut">
            {{ c.soldOut ? 'Join Waitlist' : 'Register →' }}
          </a>
        </div>
      </div>
      <div *ngIf="!loading() && courses().length === 0" class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No upcoming sessions</h3>
        <p>Check back soon or join our mailing list.</p>
      </div>
    </div>
  </section>

  <!-- CERT TYPES -->
  <section class="section section-dark">
    <div class="container">
      <div class="section-head light">
        <h2>Our <em>Certifications</em></h2>
        <p>The full SAFe® framework pathway</p>
      </div>
      <div class="certs-grid">
        <div *ngFor="let cert of certTypes" class="cert-tile">
          <div class="cert-icon">{{ cert.icon }}</div>
          <div class="cert-name">{{ cert.name }}</div>
          <div class="cert-abbr">{{ cert.abbr }}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="container footer-inner">
      <div class="brand">
        <div class="brand-mark">A</div>
        <span>AgilePro Institute</span>
      </div>
      <div class="footer-links">
        <a routerLink="/certifications">Courses</a>
        <a routerLink="/register">Register</a>
        <a routerLink="/login">Sign In</a>
        <a routerLink="/admin/login">Admin</a>
      </div>
      <div class="footer-copy">© 2026 AgilePro Institute. All rights reserved.</div>
    </div>
  </footer>
</div>
  `,
  styles: [`
.home { min-height: 100vh; }

.nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(250,248,243,0.95); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto; padding: 1rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
}
.brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--ink); }
.brand-mark { width:36px;height:36px;background:var(--amber);border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Lora',serif;font-weight:700;color:white;font-size:1rem; }
.brand span { font-family:'Lora',serif;font-weight:700;font-size:1rem; }
.nav-links { display:flex;align-items:center;gap:1.5rem; }
.nav-links a { font-size:0.875rem;font-weight:500;color:var(--ink-mid);text-decoration:none;transition:color 0.15s; }
.nav-links a:hover { color:var(--ink); }

.hero {
  background: var(--ink); min-height: 80vh;
  display: flex; align-items: center; position: relative; overflow: hidden;
  &::before { content:''; position:absolute;inset:0; background:radial-gradient(ellipse 60% 60% at 70% 50%,rgba(42,124,132,0.2) 0%,transparent 60%),radial-gradient(ellipse 40% 50% at 20% 80%,rgba(201,123,42,0.15) 0%,transparent 50%); }
}
.hero-inner { max-width:1200px;margin:0 auto;padding:5rem 2rem;position:relative;z-index:1; }
.hero-eyebrow { font-size:0.78rem;font-weight:600;color:var(--amber);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:1.5rem; }
.hero-title { font-family:'Lora',serif;font-size:clamp(2.5rem,5vw,4rem);color:white;line-height:1.1;margin-bottom:1.25rem;font-weight:700; em{color:var(--amber);font-style:italic;} }
.hero-sub { font-size:1.1rem;color:rgba(255,255,255,0.55);max-width:520px;line-height:1.8;margin-bottom:2.5rem; }
.hero-ctas { display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:3rem; }
.hero-stats { display:flex;gap:3rem;flex-wrap:wrap; }
.stat { strong{display:block;font-size:1.8rem;font-weight:700;color:white;font-family:'Lora',serif;} span{font-size:0.8rem;color:rgba(255,255,255,0.4);} }

.section { padding: 5rem 0; }
.section-dark { background:var(--ink); }
.container { max-width:1200px;margin:0 auto;padding:0 2rem; }
.section-head { margin-bottom:3rem; h2{font-family:'Lora',serif;font-size:2rem;font-weight:700;margin-bottom:0.5rem; em{color:var(--teal);font-style:italic;}} p{color:var(--ink-mid);} }
.section-head.light { h2{color:white; em{color:var(--amber);}} p{color:rgba(255,255,255,0.4);} }

.courses-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem; }
.course-card { background:white;border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;display:flex;flex-direction:column;gap:1rem;transition:box-shadow 0.2s,transform 0.2s; }
.course-card:hover { box-shadow:var(--shadow-md);transform:translateY(-2px); }
.course-card.skeleton { min-height:280px;background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border:none; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.course-card-top { display:flex;justify-content:space-between;align-items:center; }
.course-badge { background:var(--teal-light);color:var(--teal);font-size:0.7rem;font-weight:700;padding:3px 10px;border-radius:999px; }
.course-seats { font-size:0.72rem;font-weight:600;color:var(--green); }
.seats-low { color:var(--red) !important; }
.course-title { font-family:'Lora',serif;font-size:1.05rem;font-weight:700;color:var(--ink);line-height:1.3;flex:1; }
.course-meta { display:flex;flex-wrap:wrap;gap:0.75rem;font-size:0.78rem;color:var(--ink-mid); }
.course-price { .price-orig{font-size:0.8rem;color:var(--ink-light);text-decoration:line-through;} .price-now{font-size:1.1rem;font-weight:700;color:var(--ink);} .price-eb{display:flex;flex-direction:column;} }

.certs-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem; }
.cert-tile { background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.5rem 1rem;text-align:center;transition:background 0.2s; }
.cert-tile:hover { background:rgba(255,255,255,0.1); }
.cert-icon { font-size:2rem;margin-bottom:0.5rem; }
.cert-name { font-size:0.8rem;font-weight:600;color:rgba(255,255,255,0.85);margin-bottom:0.2rem; }
.cert-abbr { font-size:0.7rem;color:var(--amber); }

.footer { background:var(--ink-soft);padding:2rem 0; }
.footer-inner { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
.footer-links { display:flex;gap:1.5rem; a{color:rgba(255,255,255,0.4);font-size:0.82rem;text-decoration:none;&:hover{color:rgba(255,255,255,0.8);}} }
.footer-copy { font-size:0.75rem;color:rgba(255,255,255,0.25); }
`]
})
export class HomeComponent implements OnInit {
  auth    = inject(AuthService);
  private courseService = inject(CourseService);

  courses = signal<CourseDto[]>([]);
  loading = signal(true);

  certTypes = [
    { icon:'🌐', name:'SAFe Agilist',               abbr:'SA'   },
    { icon:'🔁', name:'SAFe Scrum Master',           abbr:'SSM'  },
    { icon:'⚡', name:'Advanced Scrum Master',       abbr:'SASM' },
    { icon:'📦', name:'Product Owner / PM',          abbr:'POPM' },
    { icon:'🚀', name:'DevOps Practitioner',         abbr:'SDP'  },
    { icon:'🛤',  name:'Release Train Engineer',     abbr:'RTE'  },
    { icon:'🏆', name:'SAFe Practice Consultant',    abbr:'SPC'  },
    { icon:'🏢', name:'Corporate Workshop',          abbr:'CW'   },
  ];

  ngOnInit() {
    this.courseService.getPublicCourses().subscribe({
      next: res => { this.courses.set(res.data || []); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  formatType(t: string): string {
    return t.replace(/_/g,' ').replace(/SAFE/,'SAFe');
  }
}
