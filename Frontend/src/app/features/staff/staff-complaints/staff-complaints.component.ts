
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffService, ComplaintAssignmentBackend } from '../../../core/staff.service';
import { AuthService } from '../../../core/auth.service';

import { ComplaintService } from '../../../core/complaint.service';


@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-complaints.component.html',
  styleUrls: ['./staff-complaints.component.css']
})
export class StaffComplaintsComponent {
private complaintSvc = inject(ComplaintService);
  private staffSvc = inject(StaffService);
  private auth = inject(AuthService);

  staffId = signal<number>(0);
  assignments = signal<ComplaintAssignmentBackend[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selected = signal<ComplaintAssignmentBackend | null>(null);

  page = signal<number>(1);
  // NOTE: pageSize is a number, not a signal
  pageSize: number = 3;

  ngOnInit() {
    // Demo: set staffId from localStorage (falls back to 1)
    const stored = Number(localStorage.getItem('staffId'));
    if(stored){
    this.staffId.set(stored);
    this.load();
    } else {
      this.error.set("User session not found. Please login again.")
    }
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.staffSvc.getAssignments(this.staffId()).subscribe({
      next: rows => this.assignments.set(rows || []),
      error: () => this.error.set('Failed to load assignments'),
      complete: () => this.loading.set(false)
    });
  }

  get paginatedComplaints() {
    const start = (this.page() - 1) * this.pageSize;
    return (this.assignments() || []).slice(start, start + this.pageSize);
  }

  next() {
    if (this.page() * this.pageSize < this.assignments().length) {
      this.page.set(this.page() + 1);
    }
  }

  prev() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
  }

  select(c: ComplaintAssignmentBackend) { this.selected.set(c); }

  updateStatus(id: number, status: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED') {
    this.staffSvc.updateAssignmentStatus(id, status).subscribe({
      next: (updated) => {
        const list = (this.assignments() || []).map(x => x.id === id ? updated : x);
        this.assignments.set(list);
      },
      error: () => this.error.set('Failed to update status')
    });
  }
}
