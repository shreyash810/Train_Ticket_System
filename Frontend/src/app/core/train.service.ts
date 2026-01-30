
// src/app/core/train.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

/** =========================
 * Backend Train entity shape
 * ========================= */
export interface Train {
  id: number;
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  totalSeats: number;
}

/** =========================================================
 * Backward-compat TYPES used by BookTicketComponent (old UI)
 * ========================================================= */
export type TrainClass = 'GENERAL' | 'SLEEPER' | 'AC';

export interface TrainResult {
  trainNo: string;
  trainName: string;
  origin: string;
  destination: string;
  originStation: string;
  destinationStation: string;
  departureTime: string;  // kept for UI compatibility (placeholder)
  arrivalTime: string;    // kept for UI compatibility (placeholder)
  date: string;           // search date echoed back

  /** NEW: backend numeric train id for /api/booking */
  backendTrainId?: number;

  classes: Array<{
    type: TrainClass;
    availableSeats: number;
    coachCount: number;
    price: number;
  }>;
}

/** =========================================================
 * Service
 * ========================================================= */
@Injectable({ providedIn: 'root' })
export class TrainService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}`;

  // -----------------------------
  // New HTTP endpoints
  // -----------------------------
  /** GET /api/trains (Admin & debug) */
  getAllTrains(): Observable<Train[]> {
    return this.http.get<Train[]>(`${this.base}/trains`);
  }

  /**
   * GET /api/stations[?exclude=&q=]
   * Use exclude to hide the selected origin from destination dropdown.
   */
  getStations(options?: { exclude?: string; q?: string }): Observable<string[]> {
    let params = new HttpParams();
    if (options?.exclude) params = params.set('exclude', options.exclude);
    if (options?.q) params = params.set('q', options.q);
    return this.http.get<string[]>(`${this.base}/stations`, { params });
  }

  /**
   * GET /api/trains/search?origin=&destination=&date=
   * NOTE: backend currently filters by origin/destination only (no date in entity).
   */
  searchTrains(origin: string, destination: string, date: string): Observable<Train[]> {
    let params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination);
    if (date) params = params.set('date', date);
    return this.http.get<Train[]>(`${this.base}/trains/search`, { params });
  }

  // -----------------------------
  // Backward-compat adapter
  // -----------------------------
  /**
   * Old UI expects:
   *  - method name: search(origin, destination, date)
   *  - return type: TrainResult[] with .classes[], times, originStation/destinationStation, etc.
   *
   * We adapt backend Train[] to TrainResult[] here.
   */
  search(origin: string, destination: string, date: string): Observable<TrainResult[]> {
    return this.searchTrains(origin, destination, date).pipe(
      map(list => list.map<TrainResult>(t => {
        // Derive class availability & pricing from totalSeats (simple split).
        const total = t.totalSeats || 0;
        const generalSeats = Math.max(0, Math.floor(total * 0.5));
        const sleeperSeats = Math.max(0, Math.floor(total * 0.3));
        const acSeats = Math.max(0, total - generalSeats - sleeperSeats);

        // Basic coach counts (rough, for UI)
        const generalCoach = Math.max(1, Math.floor(generalSeats / 50));
        const sleeperCoach = Math.max(0, Math.floor(sleeperSeats / 40));
        const acCoach = Math.max(0, Math.floor(acSeats / 30));

        return {
          trainNo: t.trainNumber,
          trainName: t.trainName,
          origin: t.origin,
          destination: t.destination,
          originStation: t.origin,          // UI needs station names
          destinationStation: t.destination,
          departureTime: '08:00',           // placeholder (no schedule in backend yet)
          arrivalTime: '12:00',             // placeholder
          date: date,                       // echo back search date
          backendTrainId: t.id,             // IMPORTANT: used by /api/booking
          classes: [
            { type: 'GENERAL',  availableSeats: generalSeats,  coachCount: generalCoach,  price: 120 },
            { type: 'SLEEPER',  availableSeats: sleeperSeats,  coachCount: sleeperCoach,  price: 300 },
            { type: 'AC',       availableSeats: acSeats,       coachCount: acCoach,       price: 650 }
          ]
        };
      }))
    );
  }
}
