
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AdminService, TrainRequest, ReservationBackend, TrainBackend } from '../../../core/admin.service';
import { TrainService, Train as TrainCore } from '../../../core/train.service';
import { AuthService } from '../../../core/auth.service';

type Tab = 'dashboard' | 'trains' | 'reservations' | 'profile';

interface UiTrain {
  id: number;
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  totalSeats: number;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit {
  private admin = inject(AdminService);
  private trainSvc = inject(TrainService);
  private auth = inject(AuthService);
  private router = inject(Router);

  /** ---- UI State ---- */
  tab = signal<Tab>('dashboard');
  brand = '#1e3a8a';

  /** ---- Profile (UI placeholders) ---- */
  adminName = 'Admin';
  adminEmail = 'admin@rail.in';
  adminRole = 'System Admin';
  editing = false;

  /** ---- Trains ---- */
  trains = signal<UiTrain[]>([]);
  trainsLoading = signal<boolean>(false);
  trainsError = signal<string | null>(null);

  // Train add form
  newTrain: TrainRequest = { trainNumber: '', trainName: '', origin: '', destination: '', totalSeats: 0 };
  trainSubmitError = signal<string | null>(null);
  trainSubmitOk = signal<string | null>(null);

  // Simple client-side filter
  search = { origin: '', destination: '', trainNumber: '' };
  filteredTrains = computed(() => {
    const list = this.trains();
    const o = (this.search.origin || '').trim().toLowerCase();
    const d = (this.search.destination || '').trim().toLowerCase();
    const tn = (this.search.trainNumber || '').trim().toLowerCase();
    return list.filter(t =>
      (!o || t.origin.toLowerCase().includes(o)) &&
      (!d || t.destination.toLowerCase().includes(d)) &&
      (!tn || t.trainNumber.toLowerCase().includes(tn))
    );
  });

  /** ---- Reservations ---- */
  reservations = signal<ReservationBackend[]>([]);
  reservationsLoading = signal<boolean>(false);
  reservationsError = signal<string | null>(null);

  /** ---- Simple counts (clean dashboard) ---- */
  totalReservations = computed(() => this.reservations().length);
  upcomingCount = computed(() => {
    const now = new Date();
    return this.reservations().filter(r => {
      const d = this.parseISO(r.travelDate);
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }).length;
  });
  pastCount = computed(() => this.totalReservations() - this.upcomingCount());

  /** ---- Lifecycle ---- */
  ngOnInit(): void {
    this.loadTrains();
    this.loadReservations();
  }

  /** ---- Data loaders ---- */
  loadTrains() {
    this.trainsLoading.set(true);
    this.trainsError.set(null);
    this.trainSvc.getAllTrains().subscribe({
      next: (rows: TrainCore[]) => {
        const mapped: UiTrain[] = rows.map(t => ({
          id: t.id,
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          origin: t.origin,
          destination: t.destination,
          totalSeats: t.totalSeats
        }));
        this.trains.set(mapped);
      },
      error: () => this.trainsError.set('Failed to load trains'),
      complete: () => this.trainsLoading.set(false),
    });
  }

  loadReservations() {
    this.reservationsLoading.set(true);
    this.reservationsError.set(null);
    this.admin.getAllReservations().subscribe({
      next: (rows) => this.reservations.set(rows || []),
      error: () => this.reservationsError.set('Failed to load reservations'),
      complete: () => this.reservationsLoading.set(false),
    });
  }

  /** ---- Add a Train ---- */
  addTrain(form: NgForm) {
    this.trainSubmitError.set(null);
    this.trainSubmitOk.set(null);

    const f = this.newTrain;
    if (!f.trainNumber || !f.trainName || !f.origin || !f.destination || !f.totalSeats) {
      this.trainSubmitError.set('Fill all fields.');
      return;
    }
    if (f.totalSeats < 1) {
      this.trainSubmitError.set('Total seats must be greater than 0.');
      return;
    }

    this.admin.addTrain({ ...f }).subscribe({
      next: (created: TrainBackend) => {
        this.trains.set([
          ...this.trains(),
          {
            id: created.id,
            trainNumber: created.trainNumber,
            trainName: created.trainName,
            origin: created.origin,
            destination: created.destination,
            totalSeats: created.totalSeats
          }
        ]);
        this.trainSubmitOk.set(`Train "${created.trainName}" added.`);
        this.newTrain = { trainNumber: '', trainName: '', origin: '', destination: '', totalSeats: 0 };
        form.resetForm();
      },
      error: () => this.trainSubmitError.set('Failed to add train.'),
    });
  }

  /** ---- Nav / Actions ---- */
  go(t: Tab) { this.tab.set(t); }
  goComplaints() { this.router.navigate(['/admin/complaints']); }
  goSearch() { this.router.navigate(['/admin/search-reservations']); }

  logout() {
    this.auth.logout();                // clears role/token/session and routes to /login
    this.router.navigate(['/admin/login']); // ensure admin login page
  }

  /** ---- Date helpers ---- */
  parseISO(s: string): Date {
    try { return new Date(`${(s || '').slice(0, 10)}T00:00:00`); }
    catch { return new Date(); }
  }

  /** Profile panel */
  edit() { this.editing = true; }
  save() { this.editing = false; alert('Profile saved (UI-only)'); }
  cancel() { this.editing = false; }
  
// Add inside the TS class
percent(value: number, total: number): string {
  if (!total) return '0%';
  return Math.round((value / total) * 100) + '%';
}

}
