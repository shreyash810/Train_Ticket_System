
import { Component, signal, inject, computed, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { TrainService, TrainResult, TrainClass } from '../../core/train.service';
import { SeatInventoryService } from '../../core/seat-inventory.service';
import {
  ReservationService,
  PassengerInfo,
  BookingRequestBackend,
  ReservationBackend
} from '../../core/reservation.service';
import { AuthService } from '../../core/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './book-ticket.component.html',
  styleUrls: ['./book-ticket.component.css']
})
export class BookTicketComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private trains = inject(TrainService);
  private seatInv = inject(SeatInventoryService);
  private reservations = inject(ReservationService);
  private auth = inject(AuthService);
  private router = inject(Router);

  allStations = signal<string[]>([]);
  originStations = computed(() => this.allStations());
  destinationStations = signal<string[]>([]);
  stationsLoading = signal<boolean>(false);
  stationsError = signal<string | null>(null);

  page = signal(1);
  pageSize = 3;

  form!: FormGroup;
  passengersForm!: FormGroup;

  results = signal<TrainResult[]>([]);
  searchError = signal<string | null>(null);
  searching = signal<boolean>(false);

  todayISO = this.computeISO(new Date());
  maxISO = this.computeISO(this.addMonths(new Date(), 2));

  selectedTrain = signal<TrainResult | null>(null);
  selectedClass = signal<TrainClass | null>(null);
  seatsRequested = signal<number>(1);
  bookingError = signal<string | null>(null);
  bookingSuccess = signal<string | null>(null);

  showPassengerForm = signal<boolean>(false);
  lastReservationId = signal<string | null>(null);

  private subs: Subscription[] = [];

  private CLASS_RATIOS: Record<TrainClass, number> = { GENERAL: 0.30, SLEEPER: 0.50, AC: 0.20 };
  private CLASS_COACHES: Record<TrainClass, number> = { GENERAL: 3, SLEEPER: 4, AC: 2 };

  private totalSeatsFor(train: TrainResult): number {
    const anyTrain: any = train as any;
    return (
      Number(anyTrain.totalSeats) ||
      Number(anyTrain.backendTotalSeats) ||
      Number(anyTrain?.train?.totalSeats) ||
      600
    );
  }
  private classCapacity(train: TrainResult, clazz: TrainClass): number {
    const total = this.totalSeatsFor(train);
    const g = Math.floor(total * this.CLASS_RATIOS.GENERAL);
    const s = Math.floor(total * this.CLASS_RATIOS.SLEEPER);
    const a = total - g - s;
    if (clazz === 'GENERAL') return g;
    if (clazz === 'SLEEPER') return s;
    return a;
  }
  private classCoachCount(clazz: TrainClass): number { return this.CLASS_COACHES[clazz]; }

  availableFor(train: TrainResult, clazz: TrainClass): number {
    const capacity = this.classCapacity(train, clazz);
    const coaches = this.classCoachCount(clazz);
    this.seatInv.getOrInit(train.trainNo, train.date, clazz, coaches, capacity);
    return this.seatInv.availableCount(train.trainNo, train.date, clazz);
  }
  getPrice(train: TrainResult, clazz: TrainClass): number {
    return train.classes.find(c => c.type === clazz)?.price ?? 0;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      origin: ['', [Validators.required]],
      destination: ['', [Validators.required]],
      date: ['', [Validators.required]],
      class: ['', [Validators.required]],
    });
    this.passengersForm = this.fb.group({ passengers: this.fb.array([]) });
    this.loadStations();
    const s1 = this.form.get('origin')!.valueChanges.subscribe(origin => {
      this.form.get('destination')!.setValue('');
      this.refreshDestinationStations(origin as string);
    });
    this.subs.push(s1);
  }
  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
  get f() { return this.form.controls; }
  get passengersArray(): FormArray { return this.passengersForm.get('passengers') as FormArray; }

  paginatedResults = computed(() => {
    const all = this.results();
    const start = (this.page() - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });
  totalPages = computed(() => {
    const total = this.results().length;
    const pages = Math.ceil(total / this.pageSize);
    return pages > 0 ? pages : 1;
  });
  nextPage() { if (this.page() < this.totalPages()) this.page.set(this.page() + 1); }
  prevPage() { if (this.page() > 1) this.page.set(this.page() - 1); }

  private computeISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  private addMonths(d: Date, months: number): Date { const copy = new Date(d); copy.setMonth(copy.getMonth() + months); return copy; }
  onSeatInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const num = input.valueAsNumber;
    this.seatsRequested.set(Number.isFinite(num) ? Math.max(0, num) : 0);
  }

  private loadStations() {
    this.stationsLoading.set(true);
    this.stationsError.set(null);
    const s = this.trains.getStations().subscribe({
      next: (list) => { this.allStations.set(list); this.destinationStations.set(list); },
      error: () => this.stationsError.set('Failed to load stations'),
      complete: () => this.stationsLoading.set(false),
    });
    this.subs.push(s);
  }
  private refreshDestinationStations(origin: string) {
    if (!origin) { this.destinationStations.set(this.allStations()); return; }
    const s = this.trains.getStations({ exclude: origin }).subscribe({
      next: (list) => this.destinationStations.set(list),
      error: () =>
        this.destinationStations.set(this.allStations().filter(s => s.toLowerCase() !== origin.toLowerCase()))
    });
    this.subs.push(s);
  }

  onSearch() {
    this.searchError.set(null);
    this.results.set([]); this.page.set(1);
    this.selectedTrain.set(null); this.selectedClass.set(null);
    this.seatsRequested.set(1);
    this.bookingError.set(null); this.bookingSuccess.set(null);
    this.showPassengerForm.set(false); this.passengersArray.clear();
    this.lastReservationId.set(null);

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const chosen = new Date(v['date']);
    const min = new Date(this.todayISO);
    const max = new Date(this.maxISO);
    if (chosen < min) { this.searchError.set('Cannot select past dates.'); return; }
    if (chosen > max) { this.searchError.set('You can only book up to 2 months ahead.'); return; }

    this.searching.set(true);
    const s = this.trains.search(v['origin'], v['destination'], v['date']).subscribe({
      next: (data) => { if (!data || data.length === 0) this.searchError.set('No trains found for the selected route/date.'); else this.results.set(data); },
      error: () => this.searchError.set('Failed to search trains. Please try again.'),
      complete: () => this.searching.set(false),
    });
    this.subs.push(s);
  }

  selectTrain(train: TrainResult, clazz: TrainClass) {
    const capacity = this.classCapacity(train, clazz);
    const coaches  = this.classCoachCount(clazz);
    this.seatInv.getOrInit(train.trainNo, train.date, clazz, coaches, capacity);
    const available = this.seatInv.availableCount(train.trainNo, train.date, clazz);
    this.selectedTrain.set(train);
    this.selectedClass.set(clazz);
    this.seatsRequested.set(1);
    this.bookingError.set(null);
    this.bookingSuccess.set(null);
    this.showPassengerForm.set(false);
    this.passengersArray.clear();
    this.lastReservationId.set(null);
    if (available <= 0) this.bookingError.set('No seats available in this class.');
  }

  onClassSelect(evt: Event) {
    const value = (evt.target as HTMLSelectElement).value as TrainClass;
    const train = this.selectedTrain();
    if (train) this.selectTrain(train, value);
  }

  proceedToBook() {
    const train = this.selectedTrain();
    const clazz = this.selectedClass();
    const seats = this.seatsRequested();
    if (!train || !clazz) { this.bookingError.set('Select a train and class first.'); return; }

    const available = this.seatInv.availableCount(train.trainNo, train.date, clazz);
    if (seats <= 0) { this.bookingError.set('Enter at least 1 seat.'); return; }
    if (seats > 7) { this.bookingError.set('You can book maximum 7 seats at a time.'); return; }
    if (seats > available) { this.bookingError.set(`Only ${available} seats available.`); return; }

    this.passengersArray.clear();
    for (let i = 0; i < seats; i++) {
      this.passengersArray.push(this.fb.group({
        name: ['', [Validators.required, Validators.pattern(/^[A-Za-z ]{2,}$/)]],
        age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
        gender: ['', [Validators.required]],
        idType: ['Aadhaar'],
        idNumber: ['1234-5678-1234']
      }));
    }
    this.showPassengerForm.set(true);
  }

  onBook() {
    if (!this.showPassengerForm()) { this.bookingError.set('Click "Proceed to Book" and enter passenger details.'); return; }
    if (this.passengersForm.invalid) { this.passengersForm.markAllAsTouched(); this.bookingError.set('Please fix errors in passenger details.'); return; }

    const train = this.selectedTrain()!;
    const clazz = this.selectedClass()!;
    const seats = this.seatsRequested();

    const allocated = this.seatInv.allocate(train.trainNo, train.date, clazz, seats);
    if (!allocated || allocated.length !== seats) {
      this.bookingError.set('Unable to allocate seats together. Try fewer seats or another class.');
      return;
    }

    const passengers: PassengerInfo[] = this.passengersArray.controls.map(
      (ctrl: any, idx: number) => ({
        name: ctrl.get('name').value,
        age: ctrl.get('age').value,
        gender: ctrl.get('gender').value,
        idType: ctrl.get('idType').value,
        idNumber: ctrl.get('idNumber').value,
        seatNumber: allocated[idx]
      })
    );

    const session = this.auth.getSession();
    if (!session) { this.bookingError.set('Session expired. Please log in again.'); return; }

    const baseAmount = (this.selectedTrain()?.classes.find(c => c.type === clazz)?.price ?? 0) * seats;

    try {
      // 1) LOCAL reservation
      const localRes = this.reservations.createReservation({
        userId: session.userId,
        email: session.email,
        travelDate: train.date,
        train: {
          trainNo: train.trainNo,
          trainName: train.trainName,
          origin: train.origin,
          destination: train.destination,
          originStation: train.originStation,
          destinationStation: train.destinationStation,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          class: clazz
        },
        passengers,
        seatNumbers: allocated,
        baseAmount
      });
      this.lastReservationId.set(localRes.reservationId);
      this.bookingSuccess.set(`Seats allocated: ${allocated.join(', ')}.`);

      // 2) BACKEND reservation (minimal) → rewrite local display ID to BK-<id> when it returns
      if ((train as any).backendTrainId) {
        const req: BookingRequestBackend = {
          passengerId: session.id,
          trainId: (train as any).backendTrainId,
          travelDate: train.date
        };
        this.reservations.createBackendReservation(req).subscribe({
          next: (bk: ReservationBackend) => {
            this.attachBackendId(localRes.reservationId, bk.id); // will also rewrite reservationId to BK-<id>
          },
          error: () => { /* non-blocking */ }
        });
      }

    } catch {
      this.bookingError.set('Reservation creation failed. Please try again.');
    }
  }

  goToPayment() {
    const resId = this.lastReservationId();
    if (!resId) { this.bookingError.set('Reservation not created yet. Please confirm seats.'); return; }
    this.router.navigate(['/payments'], { queryParams: { reservationId: resId } });
  }

  /**
   * Attach backendId and also rewrite reservationId → BK-<backendId>.
   * Keep the legacy RSV value in _legacyReservationId for tolerant lookups.
   */
  private attachBackendId(localReservationId: string, backendId: number) {
    try {
      const raw = localStorage.getItem('railInReservations');
      if (!raw) return;
      const list = JSON.parse(raw);
      const idx = list.findIndex((r: any) => r.reservationId === localReservationId);
      if (idx !== -1) {
        const prev = list[idx];
        list[idx].backendId = backendId;
        if (!String(prev.reservationId).startsWith('BK-')) {
          list[idx]._legacyReservationId = prev.reservationId;   // keep old RSV for rare deep links
        }
        list[idx].reservationId = `BK-${backendId}`;              // 👈 DISPLAY ID now backend-driven
        localStorage.setItem('railInReservations', JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  }
}
