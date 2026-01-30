
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * The app's existing components depend on a rich local Complaint model
 * (with fields like actions, assignedStaff, submittedDate, etc.).
 * The backend Complaint entity is minimal. To avoid breaking the UI, we:
 *   1) Keep storing/enriching complaints locally for the UI.
 *   2) Fire-and-forget sync to backend for creation (link via backendId).
 *   3) Keep admin/staff actions local for now (will move to Admin/Staff services later).
 */

// ===== Import the UI complaint model types (as your existing code already does) =====
import {
  Complaint,
  ComplaintStatus,
  ComplaintCategory,
  ContactPreference,
  ComplaintAction
} from '../shared/models/complaint.model';

// ===== Backend complaint DTOs (minimal) =====
interface BackendComplaint {
  id: number;
  category: string;
  title: string;
  description: string;
  status: string;
  createdAt: string; // ISO
  // passenger is @JsonIgnore on backend entity
}

interface BackendComplaintRequest {
  passengerId: number;
  category: string;
  title: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  
  private readonly apiBase = environment.apiUrl;
  private readonly LS_KEY = 'railInComplaints';

  // -----------------------------
  // Storage helpers (+ seeding)
  // -----------------------------
  private getAll(): Complaint[] {
    const raw = localStorage.getItem(this.LS_KEY);
    if (!raw) {
      const seeded = this.seedSamples();
      this.setAll(seeded);
      return seeded;
    }
    try {
      const list = JSON.parse(raw) as Complaint[];
      // Normalize for admin/staff templates
      for (const c of list) {
        if (!c.submittedDate && (c as any).createdAt) {
          // legacy normalization
          (c as any).submittedDate = (c as any).createdAt.slice(0, 10);
        }
        if ((c as any).assignedTo && !(c as any).assignedStaff) {
          (c as any).assignedStaff = (c as any).assignedTo;
        }
        if (!c.actions) c.actions = [];
      }
      return list;
    } catch {
      const seeded = this.seedSamples();
      this.setAll(seeded);
      return seeded;
    }
  }

  private setAll(list: Complaint[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(list));
  }

  private genLocalId(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.floor(Math.random() * 1e6).toString(36).toUpperCase();
    return `CMP-${ts}-${rnd}`;
  }

  /** Initial sample data (only if storage empty) — unchanged */
  private seedSamples(): Complaint[] {
    const iso = (d: Date) => d.toISOString();
    return [
      {
        id: 'CMP101',
        userId: 'DEMO-U1',
        email: 'amit.patil@example.com',
        reservationId: 'RES101',
        category: 'Payment',
        title: 'Payment deducted but ticket not generated',
        description: 'Amount deducted but ticket not confirmed.',
        contact: 'Email',
        status: 'Open',
        createdAt: iso(new Date('2025-01-01T09:00:00')),
        updatedAt: iso(new Date('2025-01-01T09:00:00')),
        expectedResolutionDate: iso(new Date('2025-01-06T09:00:00')),
        submittedDate: '2025-01-01',
        priority: 'High',
        customerName: 'Amit Patil',
        actions: []
      },
      {
        id: 'CMP102',
        userId: 'DEMO-U2',
        email: 'sneha.joshi@example.com',
        reservationId: 'RES102',
        category: 'Cleanliness',
        title: 'Dirty coach',
        description: 'Coach was unclean during travel.',
        contact: 'Email',
        status: 'In Progress',
        createdAt: iso(new Date('2025-01-02T10:20:00')),
        updatedAt: iso(new Date('2025-01-02T10:30:00')),
        expectedResolutionDate: iso(new Date('2025-01-07T10:20:00')),
        submittedDate: '2025-01-02',
        assignedTo: 'Ramesh (Cleaning)',
        assignedStaff: 'Ramesh (Cleaning)',
        priority: 'Medium',
        customerName: 'Sneha Joshi',
        actions: [
          { actionDate: '2025-01-02 10:30', actionBy: 'Ramesh', notes: 'Reported to maintenance team' }
        ]
      },
      {
        id: 'CMP103',
        userId: 'DEMO-U3',
        email: 'rahul.k@example.com',
        reservationId: 'RES103',
        category: 'Booking',
        title: 'Seat not allocated',
        description: 'Seat number missing on ticket.',
        contact: 'Call',
        status: 'Open',
        createdAt: iso(new Date('2025-01-03T08:10:00')),
        updatedAt: iso(new Date('2025-01-03T08:10:00')),
        expectedResolutionDate: iso(new Date('2025-01-08T08:10:00')),
        submittedDate: '2025-01-03',
        assignedTo: 'Ramesh (Cleaning)',
        assignedStaff: 'Ramesh (Cleaning)',
        priority: 'Low',
        customerName: 'Rahul Kulkarni',
        actions: []
      }
    ];
  }

  // -----------------------------
  // Passenger flows
  // -----------------------------

  /**
   * Create a complaint (keeps legacy return shape for UI).
   * Strategy:
   * 1) Create locally first so UI is instant.
   * 2) Fire-and-forget POST /api/complaints to sync with backend.
   *    On success, we store backendId and timestamps back into local item.
   */
  create(payload: {
    reservationId?: string;
    category: ComplaintCategory;
    title: string;
    description: string;
    contact: ContactPreference;
  }): Complaint | null {
    const session = this.auth.getSession();
    if (!session) return null;

    const now = new Date();
    const expected = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);

    // 1) Create local rich complaint for the existing UI
    const local: Complaint = {
      id: this.genLocalId(),
      userId: session.userId,          // back-compat (string)
      email: session.email,
      reservationId: payload.reservationId,
      category: payload.category,
      title: payload.title.trim(),
      description: payload.description.trim(),
      contact: payload.contact,
      status: 'Open',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expectedResolutionDate: expected.toISOString(),
      submittedDate: now.toISOString().slice(0, 10),
      customerName: session.name,
      priority: 'Low',
      actions: []
    };

    const all = this.getAll();
    all.push(local);
    this.setAll(all);

    // 2) Best-effort backend sync (no UI break even if it fails)
    const req: BackendComplaintRequest = {
      passengerId: session.id, // numeric backend id
      category: payload.category,
      title: payload.title.trim(),
      description: payload.description.trim()
    };
    this.http.post<BackendComplaint>(`${this.apiBase}/complaints`, req).subscribe({
      next: (bk) => {
        // Link local record to backend
        const list = this.getAll();
        const idx = list.findIndex(c => c.id === local.id);
        if (idx !== -1) {
          // store backend identifiers without breaking template bindings
          (list[idx] as any).backendId = bk.id;
          (list[idx] as any).serverCreatedAt = bk.createdAt;
          (list[idx] as any).serverStatus = bk.status;
          this.setAll(list);
        }
      },
      error: () => {
        // keep local-only record; you may toast/log if needed
      }
    });

    return local;
  }

  /** Legacy: list complaints for UI user (by local session userId string) */
  listForUser(userId: string): Complaint[] {
    return this.getAll()
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  /** Legacy: get a specific complaint by local id */
  getForUser(userId: string, id: string): Complaint | null {
    return this.getAll().find(c => c.userId === userId && c.id === id) ?? null;
  }

  /** Update editable fields only when status is Open (legacy) */
  updateOpen(
    id: string,
    updates: Partial<Pick<Complaint, 'title' | 'description' | 'contact' | 'category'>>
  ): boolean {
    const all = this.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return false;
    if (all[idx].status !== 'Open') return false;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    this.setAll(all);
    return true;
  }

  /** Local status update used by old templates */
  setStatus(id: string, status: ComplaintStatus, notes?: string, response?: string): boolean {
    const all = this.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return false;
    if (all[idx].status === 'Closed') return false;

    all[idx].status = status;
    all[idx].updatedAt = new Date().toISOString();
    if (notes) (all[idx] as any).resolutionNotes = notes;
    if (response) (all[idx] as any).response = response;
    this.setAll(all);
    return true;
  }

  confirmResolution(id: string): boolean {
    return this.setStatus(id, 'Closed', 'User confirmed resolution.');
  }

  reopen(id: string): boolean {
    const all = this.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return false;
    if (all[idx].status !== 'Resolved') return false;
    all[idx].status = 'Open';
    all[idx].updatedAt = new Date().toISOString();
    (all[idx] as any).resolutionNotes = undefined;
    this.setAll(all);
    return true;
  }

  // -----------------------------
  // Admin/Staff legacy helpers (local for now)
  // -----------------------------

  /** Admin: get all (legacy local list) */
  getAllComplaints(): Complaint[] {
    return this.getAll();
  }

  /** Staff: get complaints assigned to a given staff name (legacy local) */
  getComplaintsForStaff(staff: string): Complaint[] {
    return this.getAll().filter(c => (c.assignedStaff || (c as any).assignedTo) === staff);
  }

  /** Admin: assign complaint to staff (legacy local) */
  assignComplaint(id: string, staff: string) {
    const all = this.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return;
    (all[idx] as any).assignedTo = staff;
    (all[idx] as any).assignedStaff = staff;
    all[idx].status = 'In Progress';
    all[idx].updatedAt = new Date().toISOString();
    this.setAll(all);

    // NOTE:
    // Real backend endpoint exists: POST /api/admin/assign-complaint
    // It requires staffId (numeric). We'll wire this in AdminService next,
    // once we know how you want to map staff names -> staff IDs.
  }

  /** Staff: update status (legacy local) */
  updateStatus(id: string, status: ComplaintStatus) {
    this.setStatus(id, status);
    // NOTE:
    // Real backend endpoint exists for assignments:
    // PUT /api/staff/assignment/{id}?status=
    // Needs assignmentId (not complaint id) -> coming in StaffService next.
  }

  /** Admin/Staff: add a timeline action (legacy local) */
  addAction(id: string, by: string, note: string) {
    if (!note.trim()) return;
    const all = this.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return;
    if (!all[idx].actions) all[idx].actions = [];
    all[idx].actions!.push({
      actionDate: new Date().toLocaleString(),
      actionBy: by,
      notes: note
    } as ComplaintAction);
    all[idx].updatedAt = new Date().toISOString();
    this.setAll(all);
  }

  // -----------------------------
  // Optional: direct backend GET for a passenger (not used by current UI)
  // -----------------------------
  /** Direct backend fetch — useful for a future ViewComplaints v2 */
  getByPassengerFromServer(passengerId: number) {
    return this.http.get<BackendComplaint[]>(`${this.apiBase}/complaints/${passengerId}`);
  }
  
 formatCmpId(id: number | string | undefined): string {
    if (!id) return 'CMP000';
    const n = Number(id);
    if (isNaN(n)) return 'CMP000';
    return 'CMP' + n.toString().padStart(3, '0');
  }

/**
 * Create complaint and wait for backend ID; resolves CMP### string.
 * Leaves legacy local behavior intact.
 */
async createAndGetCmpId(payload: {
  reservationId?: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  contact: ContactPreference;
}): Promise<string | null> {
  const local = this.create(payload); // creates locally + starts backend sync
  if (!local) return null;

  // If backend has already responded and stored backendId, format immediately:
  let list = this.getAll();
  let rec = list.find(c => c.id === local.id);
  if ((rec as any)?.backendId) {
    return this.formatCmpId((rec as any).backendId);
  }

  // Otherwise, poll briefly for backendId (dev-friendly approach)
  const maxTries = 20; // 20 * 150ms = up to 3s
  for (let i = 0; i < maxTries; i++) {
    await new Promise(res => setTimeout(res, 150));
    list = this.getAll();
    rec = list.find(c => c.id === local.id);
    const bid = (rec as any)?.backendId;
    if (bid) return this.formatCmpId(bid);
  }
  return null; // backend failed or slow; caller can fallback
}

}

// Re-export complaint types so existing imports remain valid
export type {
  Complaint,
  ComplaintStatus,
  ComplaintCategory,
  ContactPreference,
  ComplaintAction
} from '../shared/models/complaint.model';

