
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TrainRequest {
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  totalSeats: number;
}
export interface TrainBackend {
  id: number;
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  totalSeats: number;
}
export interface AssignComplaintRequestBackend { complaintId: number; staffId: number; }
export interface ComplaintAssignmentBackend {
  id: number;
  status: string;
  updatedAt: string;
  staff: { id: number; name: string; department: string; email: string; };
}
export interface ReservationBackend {
  id: number;
  status: string;
  travelDate: string;
  train: { id: number; trainNumber: string; trainName: string; origin: string; destination: string; totalSeats: number; };
}
export interface ComplaintBackend { id: number; category: string; title: string; description: string; status: string; createdAt: string; }
export interface StaffBackend { id: number; name: string; department: string; email: string; }

export interface ReservationAdminDto {
  id: number;
  passengerName: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  travelDate: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  addTrain(payload: TrainRequest) {
    return this.http.post<TrainBackend>(`${this.base}/train`, payload);
  }

  getAllReservations() {
    return this.http.get<ReservationBackend[]>(`${this.base}/reservations`);
  }

  assignComplaint(payload: AssignComplaintRequestBackend) {
    return this.http.post<ComplaintAssignmentBackend>(`${this.base}/assign-complaint`, payload);
  }

  getAllComplaints() { return this.http.get<ComplaintBackend[]>(`${this.base}/complaints`); }
  getAllStaff() { return this.http.get<StaffBackend[]>(`${this.base}/staff`); }

  searchReservations(filters: {
    reservationId?: string;
    passengerName?: string;
    trainNumber?: string;
    status?: '' | 'Confirmed' | 'Pending' | 'Cancelled';
    reservationDate?: string;
  }) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ReservationAdminDto[]>(`${this.base}/reservations/search`, { params });
  }

  // Update status to "Confirmed" or "Pending"
  updateReservationStatus(id: number, status: 'Confirmed' | 'Pending') {
    return this.http.put<ReservationAdminDto>(`${this.base}/reservations/${id}/status`, { status });
  }

  // Cancel reservation → sets status to "Cancelled"
  cancelReservation(id: number) {
    return this.http.post<ReservationAdminDto>(`${this.base}/reservations/${id}/cancel`, {});
  }

}
