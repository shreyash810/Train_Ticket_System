
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService, Reservation } from '../../core/reservation.service';
import { AuthService } from '../../core/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.css']
})
export class MyReservationsComponent {
  upcoming = signal<Reservation[]>([]);
  past = signal<Reservation[]>([]);
  message = signal<string | null>(null);

  // Modals
  showDetails = signal<boolean>(false);
  detailsReservation = signal<Reservation | null>(null);

  showCancel = signal<boolean>(false);
  cancelReservation = signal<Reservation | null>(null);
  cancelInfo = signal<{ refundPercent: number; hours: number; amount: number } | null>(null);
  cancelForm!: FormGroup;
  cancelOutcome = signal<string | null>(null);

  constructor(
    private reservations: ReservationService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {
    this.cancelForm = this.fb.group({
      password: ['', [Validators.required]]
    });

    const session = this.auth.getSession();
    if (!session) {
      this.message.set('You must be logged in to view reservations.');
      return;
    }

    this.refreshLists();
  }

  /** Merge backend reservations (minimal) with local ones (rich), preferring local when both exist. */
  private mergeBackendAndLocal(backend: Reservation[], local: Reservation[], userId: string): Reservation[] {
    // Index local by backendId if present, else by reservationId
    const index = new Map<string, Reservation>();

    for (const r of local) {
      const key = r.backendId ? `B-${r.backendId}` : `L-${r.reservationId}`;
      index.set(key, r);
    }

    const merged: Reservation[] = [];

    for (const b of backend) {
      const key = `B-${b.backendId}`; // backendId exists for mapped items
      const localMatch = index.get(key);
      if (localMatch) {
        merged.push(localMatch);
        index.delete(key);
      } else {
        // Attach userId (string) for downstream UI that expects it
        merged.push({
          ...b,
          userId,
        });
      }
    }

    // Add remaining locals that have no backend counterpart (e.g., older demo data)
    for (const [_key, r] of index.entries()) {
      merged.push(r);
    }

    // Sort by travel date desc
    return merged.sort((a, b) => new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime());
  }

  private refreshLists() {
    this.message.set(null);
    const session = this.auth.getSession();
    if (!session) return;

    // Mark past local as completed (legacy)
    this.reservations.markCompletedWhereApplicable();

    // 1) Read local (legacy)
    const local = this.reservations.getForUser(session.userId);

    // 2) Read backend and merge
    this.reservations.getBackendReservationsByUser(session.id).subscribe({
      next: (backendUI) => {
        // Ensure each backend UI item carries a backendId and reasonable id
        const normalizedBackend = backendUI.map(b => {
          const parsedId = Number(((b.reservationId || '0') as string).replace('BK-', ''));
          return {
            ...b,
            // ❗ Parentheses added to avoid '??' with '||' precedence issue
            backendId: (b.backendId ?? parsedId) || undefined
          };
        });

        const merged = this.mergeBackendAndLocal(normalizedBackend, local, session.userId);

        const today = this.reservations.toISODate(new Date());

        const upcoming = merged.filter(r =>
          r.status !== 'completed' &&
          r.status !== 'canceled' &&
          r.travelDate >= today
        );
        const past = merged.filter(r =>
          r.status === 'completed' ||
          r.travelDate < today ||
          r.status === 'canceled'
        );

        this.upcoming.set(upcoming);
        this.past.set(past);

        if (upcoming.length === 0 && past.length === 0) {
          this.message.set('No Reservations found. Start your journey !');
        }
      },
      error: () => {
        // Backend failed — fall back to local-only lists
        const today = this.reservations.toISODate(new Date());

        const upcoming = local.filter(r =>
          r.status !== 'completed' &&
          r.status !== 'canceled' &&
          r.travelDate >= today
        );
        const past = local.filter(r =>
          r.status === 'completed' ||
          r.travelDate < today ||
          r.status === 'canceled'
        );

        this.upcoming.set(upcoming);
        this.past.set(past);

        if (upcoming.length === 0 && past.length === 0) {
          this.message.set('No Reservations found. Start your journey !');
        }
      }
    });
  }

  // --- View Details ---
  openDetails(r: Reservation) {
    this.detailsReservation.set(r);
    this.showDetails.set(true);
  }
  closeDetails() {
    this.showDetails.set(false);
    this.detailsReservation.set(null);
  }

  // --- Cancel Reservation flow ---
  startCancel(r: Reservation) {
    this.cancelOutcome.set(null);
    this.cancelForm.reset();

    // Block cancel if canceled already
    if (r.status === 'canceled') {
      this.cancelOutcome.set(`This Reservation was canceled on ${r.canceledAt ? r.canceledAt.substring(0,10) : 'earlier'}.`);
      this.showCancel.set(true);
      this.cancelReservation.set(r);
      return;
    }

    // Block if checked in
    if (r.checkedIn) {
      this.cancelOutcome.set('Cancellation not allowed: Reservation already checked in.');
      this.showCancel.set(true);
      this.cancelReservation.set(r);
      return;
    }

    const hours = this.reservations.hoursToDeparture(r.travelDate);
    if (hours < 0) {
      this.cancelOutcome.set('This Reservation cannot be canceled as it is past the allowed cancellation window.');
      this.showCancel.set(true);
      this.cancelReservation.set(r);
      return;
    }

    const percent = this.reservations.computeRefundPercentage(hours);
    const amount = Math.round((r.amount * percent) / 100);

    this.cancelInfo.set({ refundPercent: percent, hours, amount });
    this.cancelReservation.set(r);
    this.showCancel.set(true);
  }

  async confirmCancel() {
    this.cancelOutcome.set(null);
    const r = this.cancelReservation();
    if (!r) return;

    if (this.cancelForm.invalid) {
      this.cancelForm.markAllAsTouched();
      return;
    }
    const session = this.auth.getSession();
    if (!session) return;

    // If we have a backendId, cancel in backend and update UI lists.
    if (r.backendId) {
      this.reservations.deleteBackendReservation(r.backendId).subscribe({
        next: () => {
          // Also release seats in local inventory if this reservation exists locally with seat details
          // (optional best-effort: we don't have the class/seat list for backend-only rows)
          if (r.seatNumbers?.length) {
            (this.reservations as any)['seatInv']?.release(r.train.trainNo, r.travelDate, r.train.class, r.seatNumbers);
          }
          this.cancelOutcome.set('Your Reservation has been canceled.');
          this.refreshLists();
        },
        error: () => {
          this.cancelOutcome.set('Cancellation failed. Please try again.');
        }
      });
      return;
    }

    // Legacy local-only cancel path
    const pwd = this.cancelForm.get('password')!.value;
    const result = await this.reservations.cancelReservation({
      userId: session.userId,
      email: session.email,
      reservationId: r.reservationId,
      passwordPlain: pwd
    });

    this.cancelOutcome.set((result as any)?.message || 'Cancellation processed.');
    this.refreshLists();
  }

  closeCancel() {
    this.showCancel.set(false);
    this.cancelReservation.set(null);
    this.cancelInfo.set(null);
    this.cancelOutcome.set(null);
  }

  // --- UI helpers ---
  showPassengers = signal<string | null>(null); // reservationId currently expanded
  togglePassengers(resId: string) {
    this.showPassengers.set(this.showPassengers() === resId ? null : resId);
  }

  downloadDisabled(res: Reservation): boolean {
    // Disabled for unpaid or canceled
    return res.paymentStatus !== 'PAID' || res.status === 'canceled';
  }

  pendingTicketMessage(res: Reservation): string | null {
    if (res.paymentStatus === 'PENDING') {
      return 'ticket will be available after full payment.';
    }
    return null;
  }
}
