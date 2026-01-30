
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../../core/complaint.service';

import {
  AdminService,
  ComplaintBackend,
  StaffBackend,
  AssignComplaintRequestBackend
} from '../../../core/admin.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-complaints.component.html',
  styleUrls: ['./admin-complaints.component.css']
})
export class AdminComplaintsComponent {

  
constructor(
  private admin: AdminService,
  private complaintSvc: ComplaintService
) {}

  


  complaints = signal<ComplaintBackend[]>([]);
  staff = signal<StaffBackend[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // filters as signals
  searchText = signal<string>('');
  statusFilter = signal<string>('');
  categoryFilter = signal<string>('');

  // pagination
  page = signal<number>(1);
  pageSize = 3;

  // selection & assignment
  selected: ComplaintBackend | null = null;
  selectedStaffId = signal<number | null>(null);
  notify = signal<string | null>(null);

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    this.notify.set(null);

    this.admin.getAllComplaints().subscribe({
      next: (rows) => this.complaints.set(rows || []),
      error: () => this.error.set('Failed to load complaints')
    });

    this.admin.getAllStaff().subscribe({
      next: (rows) => this.staff.set(rows || []),
      error: () => this.error.set('Failed to load staff list'),
      complete: () => this.loading.set(false)
    });
  }

  filterComplaints() {
    this.page.set(1);
    this.selected = null;
  }

  filtered = computed(() => {
    const q = (this.searchText() || '').toLowerCase().trim();
    const status = this.statusFilter();
    const cat = this.categoryFilter();

    return (this.complaints() || []).filter(c =>
      (!q || (c.title?.toLowerCase().includes(q) || String(c.id).includes(q))) &&
      (!status || c.status === status) &&
      (!cat || c.category === cat)
    );
  });

  paginated = computed(() => {
    const list = this.filtered();
    const start = (this.page() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  next() {
    if (this.page() * this.pageSize < this.filtered().length) this.page.set(this.page() + 1);
  }
  prev() {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }

  selectComplaint(c: ComplaintBackend) {
    this.selected = c;
    this.selectedStaffId.set(null);
    this.notify.set(null);
  }

  assign() {
    if (!this.selected || !this.selectedStaffId()) return;
    const payload: AssignComplaintRequestBackend = {
      complaintId: this.selected.id,
      staffId: this.selectedStaffId()!
    };
    this.admin.assignComplaint(payload).subscribe({
      next: () => {
        this.notify.set('Assigned successfully and moved to IN_PROGRESS.');
        const updated = (this.complaints() || []).map(c => c.id === this.selected!.id ? { ...c, status: 'IN_PROGRESS' } : c);
        this.complaints.set(updated);
      },
      error: () => this.notify.set('Failed to assign complaint.')
    });
  }
  
  // Add this helper inside the class
  

cmpId(id: number | string | undefined) {
  return this.complaintSvc.formatCmpId(id);
}


}
