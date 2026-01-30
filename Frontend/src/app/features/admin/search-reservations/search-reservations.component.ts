
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, ReservationAdminDto } from '../../../core/admin.service';

type AdminViewStatus = '' | 'Confirmed' | 'Pending' | 'Cancelled';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-reservations.component.html',
  styleUrls: ['./search-reservations.component.css']
})
export class SearchReservationsComponent {

  // --------- Filters ----------
  criteria: {
    reservationId: string;
    passengerName: string;
    trainNumber: string;
    status: AdminViewStatus;
    reservationDate: string;
  } = {
    reservationId: '',
    passengerName: '',
    trainNumber: '',
    status: '',
    reservationDate: ''
  };

  // --------- Data/state ----------
  results: ReservationAdminDto[] = [];
  selected: ReservationAdminDto | null = null;

  page = 1;
  pageSize = 5;
  loading = false;
  error: string | null = null;

  // Inline edit state
  editingId: number | null = null;
  selectedStatusForEdit: 'Confirmed' | 'Pending' = 'Confirmed';
  saving = false;
  message: string | null = null;

  constructor(private admin: AdminService) {}

  // ---------- Search ----------
  isValidInput(): boolean {
    const textRegex = /^[a-zA-Z0-9\s-]*$/;
    return (
      textRegex.test(this.criteria.reservationId) &&
      textRegex.test(this.criteria.passengerName) &&
      textRegex.test(this.criteria.trainNumber)
    );
  }

  search() {
    this.error = null;
    this.message = null;
    if (!this.isValidInput()) {
      this.error = 'Invalid input detected. Please correct the fields.';
      return;
    }
    this.loading = true;
    this.selected = null;
    this.admin.searchReservations(this.criteria).subscribe({
      next: rows => { this.results = rows || []; this.page = 1; this.loading = false; },
      error: _ => { this.error = 'Search failed. Please try again.'; this.loading = false; }
    });
  }

  // ---------- Pagination ----------
  get paginatedResults() {
    const start = (this.page - 1) * this.pageSize;
    return this.results.slice(start, start + this.pageSize);
  }
  next() { if (this.page * this.pageSize < this.results.length) this.page++; }
  prev() { if (this.page > 1) this.page--; }

  // ---------- Details ----------
  viewTrainDetails(r: ReservationAdminDto) { this.selected = r; }

  // ---------- Inline Edit ----------
  startEdit(r: ReservationAdminDto) {
    if (r.status === 'Cancelled') return; // can't edit a cancelled reservation
    this.editingId = r.id;
    this.selectedStatusForEdit = (r.status === 'Pending') ? 'Pending' : 'Confirmed';
    this.message = null;
  }

  discardEdit() {
    this.editingId = null;
    this.message = null;
  }

  saveEdit(r: ReservationAdminDto) {
    if (this.editingId !== r.id) return;

    const confirmMsg =
      `Update reservation ${r.id} status?\n\n` +
      `Passenger : ${r.passengerName}\n` +
      `Train     : ${r.trainNumber}\n` +
      `Date      : ${r.travelDate}\n\n` +
      `Change status to: ${this.selectedStatusForEdit}`;
    const ok = window.confirm(confirmMsg);
     if(!ok) return;

    this.saving = true;
    this.admin.updateReservationStatus(r.id, this.selectedStatusForEdit).subscribe({
      next: updated => {
        const idx = this.results.findIndex(x => x.id === r.id);
        if (idx !== -1) this.results[idx] = { ...this.results[idx], status: updated.status };
        this.message = `Status updated to "${updated.status}" for BK-${r.id}.`;
        this.editingId = null;
      },
      error: err => {
        console.error('Update status failed', err);
        this.error = 'Failed to update status. Please try again.';
      },
      complete: () => this.saving = false
    });
  }

  // ---------- Cancel ----------
  cancelReservation(r: ReservationAdminDto) {
    if (r.status === 'Cancelled') return;

    const confirmMsg =
      `Cancel reservation ${r.id}?\n\n` +
      `Passenger : ${r.passengerName}\n` +
      `Train     : ${r.trainNumber}\n` +
      `Date      : ${r.travelDate}\n\n` +
      `This action will set status to "Cancelled".`;
    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    this.saving = true;
    this.admin.cancelReservation(r.id).subscribe({
      next: updated => {
        const idx = this.results.findIndex(x => x.id === r.id);
        if (idx !== -1) this.results[idx] = { ...this.results[idx], status: updated.status };
        this.message = `Reservation BK-${r.id} has been cancelled.`;
        if (this.editingId === r.id) this.editingId = null;
      },
      error: err => {
        console.error('Cancel failed', err);
        this.error = 'Failed to cancel reservation. Please try again.';
      },
      complete: () => this.saving = false
    });
  }

  // ---------- UI helpers ----------
  isEditingRow(r: ReservationAdminDto) { return this.editingId === r.id; }
  canEdit(r: ReservationAdminDto) { return r.status !== 'Cancelled' && !this.saving; }
  canCancel(r: ReservationAdminDto) { return r.status !== 'Cancelled' && !this.saving; }
}
