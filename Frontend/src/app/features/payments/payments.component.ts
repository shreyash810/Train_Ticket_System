
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ReservationService, Reservation, PaymentRequestBackend } from '../../core/reservation.service';

/* ---------------------------
   Validators (helpers)
--------------------------- */

/** Name: required, alphabets & spaces, min 3, max 50 */
function lettersSpaces(min = 3, max = 50): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(min),
    Validators.maxLength(max),
    Validators.pattern(/^[A-Za-z ]+$/)
  ];
}

/** Card number: exactly 16 digits */
function sixteenDigits(): ValidatorFn[] {
  return [Validators.required, Validators.pattern(/^\d{16}$/)];
}

/** Expiry MM/YY and must be future (not current month) */
function mmYYFutureValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const v = String(control.value ?? '').trim();
    if (!v) return { required: true };
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return { invalidExpiry: true };
    const mm = +m[1], yy = +m[2];
    if (mm < 1 || mm > 12) return { invalidExpiry: true };

    const now = new Date();
    const currentYY = now.getFullYear() % 100;
    const currentMM = now.getMonth() + 1;

    // Must be in the future strictly (not current month)
    if (yy < currentYY || (yy === currentYY && mm <= currentMM)) {
      return { expired: true };
    }
    return null;
  };
}

/** CVV: required, 3 digits (Visa/MasterCard/RuPay) */
function cvvValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const v = String(control.value ?? '').trim();
    if (!v) return { required: true };
    if (!/^\d{3}$/.test(v)) return { invalidCvv: true }; // Enforce 3 digits for demo brands
    return null;
  };
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent {
  form!: FormGroup;

  message = signal<string | null>(null);
  processing = signal<boolean>(false);

  reservation = signal<Reservation | null>(null);
  fees = signal<{
    baseAmount: number;
    gst: number;
    convenience: number;
    platform: number;
    total: number;
  } | null>(null);

  txnId = signal<string | null>(null);

  /** Computed helpers to avoid complex template expressions */
  passengerNames = computed(() => {
    const r = this.reservation();
    if (!r || !r.passengers) return '';
    return r.passengers.map(p => p.name).join(', ');
  });

  totalAmount = computed(() => this.fees()?.total ?? 0);

  /** Demo cards to autofill */
  demoCards = [
    { brand: 'Visa',       number: '4111111111111111', cvv: '123', expiry: '12/30' },
    { brand: 'MasterCard', number: '5555555555554444', cvv: '321', expiry: '11/30' },
    { brand: 'RuPay',      number: '6521211111111111', cvv: '789', expiry: '10/30' }
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private reservations: ReservationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Session check
    const session = this.auth.getSession();
    if (!session) {
      this.message.set('Your session has expired. Please re-enter your payment details.');
      // Do not return immediately; allow form creation to avoid template errors
    }

    // Expect reservationId in query params
    const resId = this.route.snapshot.queryParamMap.get('reservationId');

    if (!resId || !session) {
      this.message.set('Your session has expired. Please re-enter your payment details.');
    } else {
      const r = this.reservations.getById(session.userId, resId);
      if (!r) {
        this.message.set('Unable to load reservation. Please try again.');
      } else if (r.status === 'canceled') {
        this.message.set('This reservation is canceled; payment not allowed.');
      } else {
        this.reservation.set(r);
        const f = this.reservations.calculateFees(r.amount, r.passengers.length);
        this.fees.set(f);
      }
    }

    // Build form
    this.form = this.fb.group({
      cardholderName: ['', lettersSpaces(3, 50)],
      cardNumber: ['', sixteenDigits()],
      expiry: ['', [mmYYFutureValidator()]],
      cvv: ['', [cvvValidator()]],
      billingAddress: ['', []] // optional; enforce min length in addressTooShort()
    });
  }

  get f() { return this.form.controls; }

  /** Autofill demo card */
  useDemo(card: { brand: string; number: string; cvv: string; expiry: string }) {
    const sessionName = this.auth.getSession()?.name ?? 'Demo User';
    this.form.patchValue({
      cardholderName: sessionName,
      cardNumber: card.number,
      cvv: card.cvv,
      expiry: card.expiry
    });
    this.message.set(null);
  }

  /** Optional inline validation for billing address */
  addressTooShort(): boolean {
    const raw = String(this.f['billingAddress'].value ?? '').trim();
    return raw.length > 0 && raw.length < 5;
  }

  /** Submit payment: validates, simulates gateway, marks reservation PAID locally, then posts to backend if possible. */
  async payNow() {
    this.message.set(null);

    // Inline optional address validation
    if (this.addressTooShort()) {
      this.form.get('billingAddress')?.markAsTouched();
      this.message.set('Billing Address must be at least 5 characters if provided.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const r = this.reservation();
    const f = this.fees();
    const session = this.auth.getSession();

    if (!r || !f || !session) {
      this.message.set('Your session has expired. Please re-enter your payment details.');
      return;
    }

    this.processing.set(true);

    try {
      // Simulate secure gateway processing delay
      await new Promise(res => setTimeout(res, 2000));

      // Extra sanity check (already enforced by form validators)
      const cardNum = String(this.f['cardNumber'].value ?? '');
      if (!/^\d{16}$/.test(cardNum)) {
        this.message.set('Invalid card number');
        this.processing.set(false);
        return;
      }

      // Generate transaction ID
      const txn = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e6).toString(36).toUpperCase()}`;

      // 1) Persist local payment success (existing behavior)
      const ok = this.reservations.markPaid(session.userId, r.reservationId, txn, f.total);
      if (!ok) {
        this.message.set('Transaction failed. Please check your details and try again.');
        this.processing.set(false);
        return;
      }

      // Refresh reservation signal with latest state
      const updated = this.reservations.getById(session.userId, r.reservationId);
      if (updated) this.reservation.set(updated);

      // 2) POST to backend if backendId is present
      if (updated?.backendId) {
        const req: PaymentRequestBackend = {
          reservationId: updated.backendId,
          transactionId: txn,
          amount: f.total,
          status: 'PAID'
        };
        this.reservations.createBackendPayment(req).subscribe({
          next: () => {
            // No UI changes needed; DB now has Payment + Reservation status updated
          },
          error: () => {
            // Non-blocking: keep local success; backend payment may be retried later if you want.
          }
        });
      }

      this.txnId.set(txn);
    } catch {
      this.message.set('Transaction failed. Please check your details and try again.');
    } finally {
      this.processing.set(false);
    }
  }

  /** Navigate to Ticket page after success */
  gotoTicket() {
    const r = this.reservation();
    if (!r) return;
    this.router.navigate(['/ticket'], { queryParams: { reservationId: r.reservationId } });
  }
}

