
// src/app/core/reservation.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { SeatInventoryService } from './seat-inventory.service';

/** ========== BACKEND DTOs ========== */
export interface BookingRequestBackend {
  passengerId: number;      // from AuthService.session.id
  trainId: number;          // backend Train.id
  travelDate: string;       // ISO yyyy-MM-dd
}
export interface ReservationBackend {
  id: number;
  status: string;
  travelDate: string;       // yyyy-MM-dd
  train?: {
    id: number;
    trainNumber: string;
    trainName: string;
    origin: string;
    destination: string;
    totalSeats: number;
  };
}

/** === Payments (BACKEND) === */
export interface PaymentRequestBackend {
  reservationId: number;    // backend reservation id
  transactionId: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
}
export interface PaymentBackend {
  id: number;
  transactionId: string;
  amount: number;
  status: string;
  paymentTime: string;      // ISO
  reservation?: { id: number };
}

/** ========== FRONTEND (existing) TYPES ========== */
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'canceled';
export type PaymentStatus = 'PAID' | 'PENDING';

export interface PassengerInfo {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  idType?: string;
  idNumber?: string;
  seatNumber?: string;
}
export interface TrainDetails {
  trainNo: string;
  trainName: string;
  origin: string;
  destination: string;
  originStation: string;
  destinationStation: string;
  departureTime: string;  // 'HH:mm'
  arrivalTime: string;    // 'HH:mm'
  class: 'GENERAL' | 'SLEEPER' | 'AC';
}
export interface ReservationUI {
  reservationId: string;     // DISPLAY ID → now becomes BK-<backendId> if backendId is present
  userId: string;
  email: string;
  travelDate: string;
  createdAt: string;
  canceledAt?: string;
  train: TrainDetails;
  passengers: PassengerInfo[];
  seatNumbers: string[];
  amount: number;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  status: ReservationStatus;
  checkedIn?: boolean;
  backendId?: number;        // link to backend row
}

/** Admin view (legacy) */
export type AdminViewStatus = 'Confirmed' | 'Pending' | 'Cancelled';
export interface AdminReservationView {
  reservationId: string;
  passengerName: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureDay: string;
  departureTime: string;
  arrivalDay: string;
  arrivalTime: string;
  totalKms: number;
  reservationDate: string;
  status: AdminViewStatus;
}
export type PassengerCancelResult = {
  ok: boolean;
  message: string;
  refundAmount?: number;
  canceledAt?: string;
  status?: ReservationStatus;
};

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);
  private seatInv = inject(SeatInventoryService);

  private base = `${environment.apiUrl}/booking`;
  private readonly LS_KEY = 'railInReservations';

  // ------------- BACKEND -------------
  createBackendReservation(req: BookingRequestBackend): Observable<ReservationBackend> {
    return this.http.post<ReservationBackend>(`${this.base}`, req);
  }
  getBackendReservationsByUser(passengerId: number): Observable<ReservationUI[]> {
    return this.http.get<ReservationBackend[]>(`${this.base}/user/${passengerId}`).pipe(
      map(list => (list || []).map(r => this.toUIFromBackend(r)))
    );
  }
  deleteBackendReservation(reservationId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${reservationId}`);
  }
  toUIFromBackend(r: ReservationBackend): ReservationUI {
    const t = r.train;
    return {
      reservationId: `BK-${r.id}`,     // DISPLAY as backend id by default
      backendId: r.id,
      userId: '',
      email: '',
      travelDate: r.travelDate,
      createdAt: new Date().toISOString(),
      train: {
        trainNo: t?.trainNumber ?? 'N/A',
        trainName: t?.trainName ?? 'Train',
        origin: t?.origin ?? '',
        destination: t?.destination ?? '',
        originStation: t?.origin ?? '',
        destinationStation: t?.destination ?? '',
        departureTime: '--:--',
        arrivalTime: '--:--',
        class: 'GENERAL',
      },
      passengers: [],
      seatNumbers: [],
      amount: 0,
      paymentStatus: 'PENDING',
      status: this.normalizeBackendStatus(r.status),
      checkedIn: false,
    };
  }
  private normalizeBackendStatus(s: string | undefined | null): ReservationStatus {
    const val = (s || '').toUpperCase();
    if (val === 'CONFIRMED') return 'confirmed';
    if (val === 'COMPLETED') return 'completed';
    if (val === 'CANCELLED' || val === 'CANCELED') return 'canceled';
    return 'pending';
  }

  /** === Payments to backend === */
  createBackendPayment(req: PaymentRequestBackend) {
    return this.http.post<PaymentBackend>(`${environment.apiUrl}/payments`, req);
  }

  // ------------- LOCAL (legacy) -------------
  private loadLocal(): ReservationUI[] {
    const raw = localStorage.getItem(this.LS_KEY);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw) as ReservationUI[];
      return this.normalizeLocalIds(list);
    } catch {
      localStorage.removeItem(this.LS_KEY);
      return [];
    }
  }
  private saveLocal(list: ReservationUI[]) {
    const normalized = this.normalizeLocalIds(list);
    localStorage.setItem(this.LS_KEY, JSON.stringify(normalized));
  }

  private normalizeLocalIds(list: ReservationUI[]): ReservationUI[] {
    let changed = false;
    const out = list.map(r => {
      if (r.backendId && !String(r.reservationId).startsWith('BK-')) {
        changed = true;
        return { ...r, reservationId: `BK-${r.backendId}` };
      }
      return r;
    });
    if (changed) {
      try { localStorage.setItem(this.LS_KEY, JSON.stringify(out)); } catch {}
    }
    return out;
  }

  createReservation(input: {
    userId: string;
    email: string;
    travelDate: string;
    train: TrainDetails;
    passengers: PassengerInfo[];
    seatNumbers: string[];
    baseAmount: number;
  }): ReservationUI {
    const all = this.loadLocal();
    const reservation: ReservationUI = {
      reservationId: `RSV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1e6).toString(36).toUpperCase()}`,
      userId: input.userId,
      email: input.email,
      travelDate: input.travelDate,
      createdAt: new Date().toISOString(),
      train: input.train,
      passengers: input.passengers,
      seatNumbers: input.seatNumbers,
      amount: input.baseAmount,
      paymentStatus: 'PENDING',
      status: 'pending',
      checkedIn: false
    };
    all.push(reservation);
    this.saveLocal(all);
    return reservation;
  }

  getForUser(userId: string): ReservationUI[] {
    const all = this.loadLocal().filter(r => r.userId === userId);
    return all.sort((a, b) => new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime());
  }

  getById(userId: string, id: string): ReservationUI | null {
    const all = this.loadLocal().filter(r => r.userId === userId);
    let found = all.find(r => r.reservationId === id);
    if (found) return found;

    if (id.startsWith('BK-')) {
      const n = Number(id.replace('BK-', ''));
      if (!isNaN(n)) {
        found = all.find(r => r.backendId === n);
        if (found) return found;
      }
    }

    found = all.find(r => (r as any)._legacyReservationId === id);
    if (found) return found;

    const tryNum = Number(id);
    if (!isNaN(tryNum)) {
      found = all.find(r => r.backendId === tryNum);
      if (found) return found;
    }

    return null;
  }

  markPaid(userId: string, reservationId: string, txn: string, amount: number): boolean {
    const all = this.loadLocal();
    const idx = all.findIndex(r => r.userId === userId && r.reservationId === reservationId);
    if (idx === -1) return false;
    const r = { ...all[idx] };
    r.paymentStatus = 'PAID';
    r.paymentTransactionId = txn;
    r.amount = amount;
    if (r.status === 'pending') r.status = 'confirmed';

    all[idx] = r;
    this.saveLocal(all);
    return true;
  }

  // ---- Utilities
  toISODate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  hoursToDeparture(travelDateISO: string): number {
    const now = new Date();
    const travelDate = new Date(`${travelDateISO}T00:00:00`);
    const diffMs = travelDate.getTime() - now.getTime();
    return Math.floor(diffMs / 36e5);
  }
  computeRefundPercentage(hoursToDeparture: number): number {
    if (hoursToDeparture >= 48) return 100;
    if (hoursToDeparture >= 24) return 50;
    return 0;
  }
  markCompletedWhereApplicable() {
    const today = this.toISODate(new Date());
    const all = this.loadLocal();
    let changed = false;
    for (const r of all) {
      if (r.status !== 'canceled' && r.travelDate < today) {
        if (r.status !== 'completed') {
          r.status = 'completed';
          changed = true;
        }
      }
    }
    if (changed) this.saveLocal(all);
  }
  calculateFees(baseAmount: number, passengerCount: number) {
    const gst = Math.round(baseAmount * 0.18);
    const convenience = passengerCount * 20;
    const platform = 10;
    const total = baseAmount + gst + convenience + platform;
    return { baseAmount, gst, convenience, platform, total };
  }

  private toAdminStatus(s: ReservationStatus): AdminViewStatus {
    switch (s) {
      case 'confirmed': return 'Confirmed';
      case 'pending':   return 'Pending';
      case 'canceled':  return 'Cancelled';
      case 'completed': return 'Confirmed';
      default:          return 'Pending';
    }
  }
  private fromAdminStatus(s: AdminViewStatus): ReservationStatus {
    switch (s) {
      case 'Confirmed': return 'confirmed';
      case 'Pending':   return 'pending';
      case 'Cancelled': return 'canceled';
      default:          return 'pending';
    }
  }
  search(criteria: {
    reservationId?: string;
    passengerName?: string;
    trainNumber?: string;
    status?: '' | 'Confirmed' | 'Pending' | 'Cancelled';
    reservationDate?: string;
  }): AdminReservationView[] {
    const all = this.loadLocal();
    const rows: AdminReservationView[] = all.map(r => ({
      reservationId: r.reservationId,
      passengerName: r.passengers?.[0]?.name || (r.email?.split('@')[0] || 'Passenger'),
      trainNumber: r.train.trainNo,
      trainName: r.train.trainName,
      source: r.train.origin,
      destination: r.train.destination,
      departureDay: 'Day 1',
      departureTime: r.train.departureTime,
      arrivalDay: 'Day 1',
      arrivalTime: r.train.arrivalTime,
      totalKms: 0,
      reservationDate: (r.createdAt || '').slice(0, 10),
      status: this.toAdminStatus(r.status),
    }));

    return rows.filter(row =>
      (!criteria.reservationId || row.reservationId.includes(criteria.reservationId)) &&
      (!criteria.passengerName || row.passengerName.toLowerCase().includes((criteria.passengerName as string).toLowerCase())) &&
      (!criteria.trainNumber || row.trainNumber.includes(criteria.trainNumber)) &&
      (!criteria.status || row.status === criteria.status) &&
      (!criteria.reservationDate || row.reservationDate === criteria.reservationDate)
    );
  }

  // ---- Cancel reservation (legacy overloads)
  async cancelReservation(id: string): Promise<boolean>;
  async cancelReservation(opts: {
    userId: string;
    email: string;
    reservationId: string;
    passwordPlain: string;
  }): Promise<PassengerCancelResult>;
  async cancelReservation(
    arg: string | { userId: string; email: string; reservationId: string; passwordPlain: string; }
  ): Promise<boolean | PassengerCancelResult> {
    if (typeof arg === 'string') {
      const id = arg;
      const all = this.loadLocal();
      const idx = all.findIndex(r => r.reservationId === id);
      if (idx === -1) return false;
      const res = all[idx];
      if (res.status === 'canceled') return false;
      res.status = 'canceled';
      res.canceledAt = new Date().toISOString();
      all[idx] = res;
      this.saveLocal(all);
      this.seatInv.release(res.train.trainNo, res.travelDate, res.train.class, res.seatNumbers);
      return true;
    }

    const { userId, email, reservationId } = arg;
    const all = this.loadLocal();
    const idx = all.findIndex(r => r.userId === userId && r.reservationId === reservationId);
    if (idx === -1) {
      return { ok: false, message: 'Reservation not found.' };
    }

    const res = all[idx];
    if (res.status === 'canceled') {
      return { ok: false, message: `This Reservation was canceled on ${res.canceledAt ? res.canceledAt.substring(0, 10) : 'earlier'}.` };
    }
    if (res.checkedIn) {
      return { ok: false, message: 'Cancellation not allowed: Reservation already checked in.' };
    }

    const hours = this.hoursToDeparture(res.travelDate);
    if (hours < 0) {
      return { ok: false, message: 'This Reservation cannot be canceled as it is past the allowed cancellation window.' };
    }

    const percent = this.computeRefundPercentage(hours);
    const refundAmount = Math.round((res.amount * percent) / 100);

    res.status = 'canceled';
    res.canceledAt = new Date().toISOString();
    all[idx] = res;
    this.saveLocal(all);
    this.seatInv.release(res.train.trainNo, res.travelDate, res.train.class, res.seatNumbers);

    const message = percent > 0
      ? `Your Reservation has been canceled. A refund of ₹${refundAmount} will be processed within 3-5 business days.`
      : 'As per the ticket cancellation policy, this Reservation is non-refundable.';

    return { ok: true, message, refundAmount, canceledAt: res.canceledAt, status: res.status };
  }
}
export type Reservation = ReservationUI;
