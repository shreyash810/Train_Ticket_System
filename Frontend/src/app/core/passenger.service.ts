
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface PassengerDto {
  id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  dob: string; // ISO (yyyy-MM-dd)
}
export interface UpdatePassengerRequest {
  name: string;
  mobile: string;
  address: string;
}

@Injectable({ providedIn: 'root' })
export class PassengerService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/passenger`; // NOTE: singular!

  getById(id: number) {
    return this.http.get<PassengerDto>(`${this.base}/${id}`);
  }
  update(id: number, req: UpdatePassengerRequest) {
    return this.http.put<PassengerDto>(`${this.base}/${id}`, req);
  }
}
