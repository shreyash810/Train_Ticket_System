
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PaymentRow {
  id: number;
  transactionId: string;
  amount: number;
  status: string;
  paymentTime: string;     // ISO from backend
  reservationId: number | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payments`;

  getByPassenger(passengerId: number) {
    return this.http.get<PaymentRow[]>(`${this.base}/user/${passengerId}`);
  }
}
