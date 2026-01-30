
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ReservationService, Reservation } from '../../core/reservation.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.css']
})
export class TicketComponent {
  message = signal<string | null>(null);
  reservation = signal<Reservation | null>(null);

  // static instructions (at least 5)
  instructions = [
    'Please arrive at the boarding station at least 30 minutes before departure.',
    'Carry a valid government photo ID for verification.',
    'Ensure your ticket QR/ID is accessible on your phone or as a printout.',
    'No smoking allowed on the train or at the station premises.',
    'Follow coach and seat assignments; contact staff for assistance.',
  ];

  constructor(
    private auth: AuthService,
    private reservations: ReservationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const session = this.auth.getSession();
    if (!session) {
      this.message.set('Please log in to view your ticket.');
      return;
    }
    const resId = this.route.snapshot.queryParamMap.get('reservationId');
    if (!resId) {
      this.message.set('Ticket generation failed. Please try again later.');
      return;
    }
    const r = this.reservations.getById(session.userId, resId);
    if (!r) {
      this.message.set('Ticket generation failed. Please try again later.');
      return;
    }
    // Guard: only PAID + confirmed/completed; not canceled
    if (r.paymentStatus !== 'PAID' || r.status === 'canceled') {
      this.message.set('Ticket will be available after full payment or if not canceled.');
      return;
    }
    this.reservation.set(r);
  }

  coachFromSeat(seat: string | undefined) {
    if (!seat) return '-';
    // Seat like "A1-01" → coach "A1"
    const parts = seat.split('-');
    return parts[0] || '-';
  }

  printTicket() {
    window.print();
    // You can also show a toast message after print
  }

  backToReservations() {
    this.router.navigate(['/my-reservations']);
  }
}
