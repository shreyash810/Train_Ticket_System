
// src/app/core/staff.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Backend assignment object */
export interface ComplaintAssignmentBackend {
  id: number;
  status: string;
  updatedAt: string;
  complaint?: any; // backend hides complaint via @JsonIgnore
  staff: {
    id: number;
    name: string;
    department: string;
    email: string;
  };
}

/** Backend-to-UI adapted assignment */
export interface StaffAssignmentUI {
  assignmentId: number;
  complaintId?: number;
  status: string;
  staffId: number;
  staffName: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/staff`;

  /**
   * Get assignments for a staff member.
   * Backend requires staffId (Long).
   */
  getAssignments(staffId: number) {
    return this.http.get<ComplaintAssignmentBackend[]>(`${this.base}/assignments/${staffId}`);
  }

  /**
   * Update status of an assignment.
   * Backend endpoint: PUT /api/staff/assignment/{id}?status=
   */
  updateAssignmentStatus(assignmentId: number, status: string) {
    return this.http.put<ComplaintAssignmentBackend>(
      `${this.base}/assignment/${assignmentId}`,
      null,
      { params: { status } }
    );
  }

  /**
   * Convert backend assignment to StaffAssignmentUI for compatibility
   */
  convertToUI(data: ComplaintAssignmentBackend[]): StaffAssignmentUI[] {
    return data.map(d => ({
      assignmentId: d.id,
      complaintId: (d as any).complaintId, // if available in future
      status: d.status,
      staffId: d.staff.id,
      staffName: d.staff.name,
      updatedAt: d.updatedAt
    }));
  }
}
