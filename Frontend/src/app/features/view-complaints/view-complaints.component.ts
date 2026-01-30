
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintService, Complaint } from '../../core/complaint.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-view-complaints',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-complaints.component.html',
  styleUrls: ['./view-complaints.component.css']
})
export class ViewComplaintsComponent {

  // ✔ properly injected services
  constructor(
    public complaintSvc: ComplaintService,
    private auth: AuthService
  ) {}

  message = signal<string | null>(null);
  complaints = signal<Complaint[]>([]);
  selected = signal<Complaint | null>(null);

  ngOnInit() {
    const session = this.auth.getSession();
    if (!session) {
      this.message.set('You have not registered any complaints.');
      return;
    }
    this.refresh(session.userId);
  }

  refresh(userId: string) {
    try {
      const list = this.complaintSvc.listForUser(userId);
      this.complaints.set(list);
      this.message.set(list.length ? null : 'You have not registered any complaints.');
      this.selected.set(null);
    } catch {
      this.message.set('Unable to fetch complaint status.');
    }
  }

  view(c: Complaint) {
    this.selected.set(c);
  }

  confirmResolution() {
    const c = this.selected();
    if (!c) return;
    this.complaintSvc.confirmResolution(c.id);
    const session = this.auth.getSession();
    if (session) this.refresh(session.userId);
  }

  reopenComplaint() {
    const c = this.selected();
    if (!c) return;
    this.complaintSvc.reopen(c.id);
    const session = this.auth.getSession();
    if (session) this.refresh(session.userId);
  }
}