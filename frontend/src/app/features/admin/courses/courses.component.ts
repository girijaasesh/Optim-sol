import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CourseService } from '../../../core/services/services';
import { CourseDto } from '../../../core/models/auth.models';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="page-wrap">
  <div class="page-header">
    <div>
      <h1>Courses</h1>
      <p>Manage SAFe certification course catalogue</p>
    </div>
    <button class="btn btn-primary" (click)="openModal()">+ New Course</button>
  </div>

  <!-- FILTERS -->
  <div class="filter-bar">
    <select class="form-control" style="width:auto" [(ngModel)]="filterType" (change)="loadCourses()">
      <option value="">All Types</option>
      <option *ngFor="let t of courseTypes" [value]="t.value">{{ t.label }}</option>
    </select>
    <select class="form-control" style="width:auto" [(ngModel)]="filterStatus" (change)="loadCourses()">
      <option value="">All Status</option>
      <option value="active">Active</option>
      <option value="soldout">Sold Out</option>
    </select>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading()" class="courses-table">
    <div *ngFor="let s of [1,2,3,4]" class="skeleton-row"></div>
  </div>

  <!-- TABLE -->
  <div *ngIf="!loading()" class="table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>Course</th><th>Type</th><th>Dates</th><th>Format</th>
          <th>Seats</th><th>Price (USD)</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of courses()">
          <td>
            <div class="td-title">{{ c.title }}</div>
            <div class="td-sub" *ngIf="c.venue || c.zoomLink">
              {{ c.format === 'VIRTUAL' ? c.zoomLink : c.venue }}
            </div>
          </td>
          <td><span class="badge badge-teal">{{ formatType(c.certificationType) }}</span></td>
          <td>
            <div>{{ c.startDate | date:'d MMM yy' }}</div>
            <div class="td-sub">→ {{ c.endDate | date:'d MMM yy' }}</div>
          </td>
          <td>{{ c.format === 'VIRTUAL' ? '💻' : '🏢' }} {{ c.format }}</td>
          <td>
            <div class="seats-bar">
              <div class="seats-fill"
                [style.width.%]="((c.maxSeats - c.seatsRemaining) / c.maxSeats) * 100"
                [class.seats-warn]="c.seatsRemaining <= 5"
                [class.seats-full]="c.seatsRemaining === 0"></div>
            </div>
            <div class="td-sub">{{ c.seatsRemaining }}/{{ c.maxSeats }} left</div>
          </td>
          <td>
            <div *ngIf="c.earlyBirdActive" class="price-stack">
              <span class="price-orig">{{ c.price | currency }}</span>
              <span class="price-eb">{{ c.effectivePrice | currency }} 🐦</span>
            </div>
            <span *ngIf="!c.earlyBirdActive">{{ c.effectivePrice | currency }}</span>
          </td>
          <td>
            <span class="badge" [class]="c.soldOut ? 'badge-red' : c.active ? 'badge-green' : 'badge-grey'">
              {{ c.soldOut ? 'Sold Out' : c.active ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td>
            <div class="action-row">
              <button class="btn-icon-sm" (click)="editCourse(c)" title="Edit">✏️</button>
              <button class="btn-icon-sm" (click)="duplicate(c.id)" title="Duplicate">📋</button>
              <button class="btn-icon-sm" *ngIf="!c.soldOut" (click)="markSoldOut(c.id)" title="Mark Sold Out">🔴</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="courses().length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>No courses yet</h3>
      <p>Create your first course to get started</p>
    </div>
  </div>
</div>

<!-- MODAL -->
<div class="modal-backdrop" *ngIf="showModal()" (click)="closeModal()">
  <div class="modal-box" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h3>{{ editingId() ? 'Edit Course' : 'New Course' }}</h3>
      <button class="modal-close" (click)="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div *ngIf="saveAlert()" class="alert" [class]="'alert-' + saveAlertType()">{{ saveAlert() }}</div>
      <form [formGroup]="courseForm" class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Certification Type *</label>
          <select formControlName="certificationType" class="form-control">
            <option value="">Select type</option>
            <option *ngFor="let t of courseTypes" [value]="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Course Title *</label>
          <input formControlName="title" class="form-control" placeholder="e.g. SAFe Agilist (SA)">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Description</label>
          <textarea formControlName="description" class="form-control" rows="3" placeholder="Course overview…"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Price (USD) *</label>
          <input formControlName="price" type="number" class="form-control" placeholder="1595">
        </div>
        <div class="form-group">
          <label class="form-label">Early Bird Price (USD)</label>
          <input formControlName="earlyBirdPrice" type="number" class="form-control" placeholder="1295">
        </div>
        <div class="form-group">
          <label class="form-label">Early Bird Deadline</label>
          <input formControlName="earlyBirdDeadline" type="date" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">Max Seats *</label>
          <input formControlName="maxSeats" type="number" class="form-control" placeholder="20">
        </div>
        <div class="form-group">
          <label class="form-label">Duration (days)</label>
          <input formControlName="durationDays" type="number" class="form-control" placeholder="2">
        </div>
        <div class="form-group">
          <label class="form-label">Format</label>
          <select formControlName="format" class="form-control">
            <option value="VIRTUAL">Virtual</option>
            <option value="IN_PERSON">In Person</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input formControlName="startDate" type="date" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">End Date</label>
          <input formControlName="endDate" type="date" class="form-control">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Zoom Link / Venue</label>
          <input formControlName="zoomLink" class="form-control" placeholder="https://zoom.us/j/…">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Target Audience</label>
          <input formControlName="targetAudience" class="form-control" placeholder="Scrum Masters, Team Leads">
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
      <button class="btn btn-primary" (click)="saveCourse()" [disabled]="saving()">
        {{ saving() ? 'Saving…' : editingId() ? 'Update Course' : 'Create Course' }}
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
:host { display:block; }
.page-wrap { max-width:1200px; }
.page-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem; h1{font-family:'Lora',serif;font-size:1.75rem;font-weight:700;} p{color:var(--ink-mid);font-size:0.875rem;} }
.filter-bar { display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap; }
.table-card { background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden; }
.data-table { width:100%;border-collapse:collapse; }
.data-table th { background:#f9f8f5;padding:0.75rem 1rem;text-align:left;font-size:0.75rem;font-weight:700;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border); }
.data-table td { padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.875rem;vertical-align:middle; }
.data-table tr:last-child td { border-bottom:none; }
.data-table tbody tr:hover { background:#faf9f6; }
.td-title { font-weight:600;color:var(--ink); }
.td-sub { font-size:0.72rem;color:var(--ink-light);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px; }
.badge { display:inline-block;padding:3px 10px;border-radius:999px;font-size:0.7rem;font-weight:700; }
.badge-teal { background:var(--teal-light);color:var(--teal); }
.badge-green { background:#dcfce7;color:#166534; }
.badge-red { background:#fee2e2;color:#991b1b; }
.badge-grey { background:#f3f4f6;color:#6b7280; }
.seats-bar { height:4px;background:var(--cream-mid);border-radius:2px;margin-bottom:4px;overflow:hidden; }
.seats-fill { height:100%;background:var(--teal);border-radius:2px;transition:width 0.3s; }
.seats-warn { background:#f59e0b; }
.seats-full { background:var(--red); }
.price-stack { display:flex;flex-direction:column; }
.price-orig { font-size:0.72rem;color:var(--ink-light);text-decoration:line-through; }
.price-eb { font-weight:600;color:var(--amber); }
.action-row { display:flex;gap:4px; }
.btn-icon-sm { background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:0.85rem;cursor:pointer;transition:all 0.15s; &:hover{background:var(--cream);} }
.skeleton-row { height:60px;background:linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;margin-bottom:2px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.empty-state { text-align:center;padding:3rem;color:var(--ink-mid); .empty-icon{font-size:2.5rem;margin-bottom:1rem;} h3{font-weight:700;} p{font-size:0.875rem;} }
.modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:2rem;overflow-y:auto; }
.modal-box { background:white;border-radius:16px;width:100%;max-width:640px;margin:auto; }
.modal-header { display:flex;justify-content:space-between;align-items:center;padding:1.5rem;border-bottom:1px solid var(--border); h3{font-family:'Lora',serif;font-size:1.1rem;font-weight:700;} }
.modal-close { background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--ink-mid);&:hover{color:var(--ink);} }
.modal-body { padding:1.5rem; }
.modal-footer { padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:0.75rem; }
.form-grid { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
.alert { padding:0.75rem 1rem;border-radius:8px;font-size:0.82rem;margin-bottom:1rem; }
.alert-ok { background:#f0fdf4;color:#166534;border:1px solid #bbf7d0; }
.alert-err { background:#fef2f2;color:#991b1b;border:1px solid #fecaca; }
`]
})
export class CoursesComponent implements OnInit {
  private cs = inject(CourseService);
  private fb = inject(FormBuilder);

  courses    = signal<CourseDto[]>([]);
  loading    = signal(true);
  showModal  = signal(false);
  saving     = signal(false);
  editingId  = signal<number | null>(null);
  saveAlert  = signal('');
  saveAlertType = signal<'ok'|'err'>('ok');
  filterType   = '';
  filterStatus = '';

  courseTypes = [
    {value:'SAFE_AGILIST',        label:'SAFe Agilist (SA)'},
    {value:'SAFE_SCRUM_MASTER',   label:'SAFe Scrum Master (SSM)'},
    {value:'SAFE_ADVANCED_SCRUM_MASTER', label:'Advanced Scrum Master (SASM)'},
    {value:'SAFE_POPM',           label:'Product Owner / PM (POPM)'},
    {value:'SAFE_DEVOPS',         label:'DevOps Practitioner (SDP)'},
    {value:'SAFE_RTE',            label:'Release Train Engineer (RTE)'},
    {value:'SAFE_SPC',            label:'SAFe Practice Consultant (SPC)'},
    {value:'CORPORATE_WORKSHOP',  label:'Corporate Workshop'},
  ];

  courseForm = this.fb.group({
    certificationType: ['', Validators.required],
    title:            ['', Validators.required],
    description:      [''],
    price:            [null, [Validators.required, Validators.min(1)]],
    earlyBirdPrice:   [null],
    earlyBirdDeadline:[''],
    maxSeats:         [20, [Validators.required, Validators.min(1)]],
    durationDays:     [2],
    format:           ['VIRTUAL'],
    startDate:        [''],
    endDate:          [''],
    zoomLink:         [''],
    targetAudience:   [''],
  });

  ngOnInit() { this.loadCourses(); }

  loadCourses() {
    this.loading.set(true);
    this.cs.getPublicCourses(this.filterType || undefined).subscribe({
      next: r => { this.courses.set(r.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openModal()  { this.editingId.set(null); this.courseForm.reset({format:'VIRTUAL',maxSeats:20,durationDays:2}); this.saveAlert.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  editCourse(c: CourseDto) {
    this.editingId.set(c.id);
    this.courseForm.patchValue({
      certificationType: c.certificationType, title: c.title, description: c.description,
      price: c.price as any, earlyBirdPrice: c.earlyBirdPrice as any,
      earlyBirdDeadline: c.earlyBirdDeadline || '', maxSeats: c.maxSeats,
      durationDays: c.durationDays, format: c.format, startDate: c.startDate || '',
      endDate: c.endDate || '', zoomLink: c.zoomLink || '', targetAudience: c.targetAudience || ''
    });
    this.saveAlert.set(''); this.showModal.set(true);
  }

  saveCourse() {
    if (this.courseForm.invalid) { this.courseForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const obs = this.editingId()
      ? this.cs.updateCourse(this.editingId()!, this.courseForm.value as any)
      : this.cs.createCourse(this.courseForm.value as any);
    obs.subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) { this.saveAlert.set(r.message); this.saveAlertType.set('ok'); this.loadCourses(); setTimeout(() => this.closeModal(), 1200); }
        else { this.saveAlert.set(r.message); this.saveAlertType.set('err'); }
      },
      error: e => { this.saving.set(false); this.saveAlert.set(e.error?.message || 'Save failed'); this.saveAlertType.set('err'); }
    });
  }

  duplicate(id: number) {
    this.cs.duplicateCourse(id).subscribe({ next: () => this.loadCourses() });
  }

  markSoldOut(id: number) {
    if (!confirm('Mark this course as sold out?')) return;
    // Use updateCourse workaround or dedicated endpoint
    this.loadCourses();
  }

  formatType(t: string) { return t.replace(/_/g,' ').replace('SAFE','SAFe®'); }
}
