
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComplaintService, ComplaintCategory, ContactPreference, Complaint } from '../../core/complaint.service';
import { AuthService } from '../../core/auth.service';
import { ReservationService, Reservation } from '../../core/reservation.service';

@Component({
  selector: 'app-register-complaint',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-complaint.component.html',
  styleUrls: ['./register-complaint.component.css']
})
export class RegisterComplaintComponent {
  private fb = inject(FormBuilder);
  private complaints = inject(ComplaintService);
  private auth = inject(AuthService);
  private reservationsSvc = inject(ReservationService);

  form!: FormGroup;

  submitted = signal<boolean>(false);
  complaintId = signal<string>('');
  message = signal<string | null>(null);

  categories: ComplaintCategory[] = [
    'Train Issue', 'Reservation Process Issue', 'Payment Issue', 'Ticket Generation Issue'
  ];
  contactOptions: ContactPreference[] = ['Call', 'Email'];

  // Reservation options from backend
  reservationOptions = signal<{label: string; value: string}[]>([]);
  loadingReservations = signal<boolean>(false);

  constructor() {
    this.form = this.fb.group({
      category: ['', [Validators.required]],
      reservationId: ['', [Validators.required]],
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      contact: ['', [Validators.required]]
    });

    if (!this.auth.getSession()) {
      this.message.set('Please log in to submit a complaint.');
    } else {
      this.loadReservationsForUser();
    }
  }

  get f() { return this.form.controls; }

  private loadReservationsForUser() {
    const session = this.auth.getSession();
    if (!session) return;
    this.loadingReservations.set(true);
    this.reservationsSvc.getBackendReservationsByUser(session.id).subscribe({
      next: (rows) => {
        // rows are mapped to UI by service earlier; backendId is embedded
        // Use BK-<id> for label (or include train + date if you prefer)
        const opts = rows.map(r => ({
          label: r.backendId ? `BK-${r.backendId} • ${r.train.trainName} • ${r.travelDate}` : `${r.reservationId} • ${r.train.trainName} • ${r.travelDate}`,
          value: r.backendId ? `BK-${r.backendId}` : r.reservationId
        }));
        this.reservationOptions.set(opts);
      },
      error: () => this.message.set('Unable to load reservations for complaint form.'),
      complete: () => this.loadingReservations.set(false)
    });
  }

 
async onSubmit() {
  this.message.set(null);
  this.submitted.set(false);
  this.complaintId.set('');

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.message.set('Please fill in all required fields.');
    return;
  }

  const v = this.form.value;

  // ✅ Use helper to create and wait for backendId, then format CMP###
  const cmp = await this.complaints.createAndGetCmpId({
    reservationId: v['reservationId']?.toString(),
    category: v['category'] as any,
    title: v['title'],
    description: v['description'],
    contact: v['contact'] as any
  });

  if (!cmp) {
    // Backend failed to return quickly — still show success without CMP or show a temporary message
    this.message.set('Complaint submitted. Backend ID will appear shortly.');
    this.submitted.set(true);
    return;
  }

  this.complaintId.set(cmp);
  this.submitted.set(true);
}


  onReset() {
    this.form.reset();
    this.submitted.set(false);
    this.complaintId.set('');
    this.message.set(null);
  }
}
