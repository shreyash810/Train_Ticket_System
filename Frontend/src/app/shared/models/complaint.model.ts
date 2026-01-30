
export type ComplaintAction = {
  actionDate: string;
  actionBy: string;
  notes: string;
};

export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Escalated';

export type ComplaintCategory =
  | 'Train Issue'
  | 'Reservation Process Issue'
  | 'Payment Issue'
  | 'Ticket Generation Issue'
  // Admin UI categories
  | 'Payment'
  | 'Booking'
  | 'Cleanliness'
  | 'Service';

export type ContactPreference = 'Call' | 'Email';

export interface Complaint {
  id: string;                     // CMP-<base36>-<rnd>
  userId: string;
  email: string;

  reservationId?: string;
  category: ComplaintCategory;
  title: string;                  // 10–100 chars
  description: string;            // 20–500 chars
  contact: ContactPreference;

  status: ComplaintStatus;        // Open → In Progress → Resolved → Closed/Escalated
  createdAt: string;
  updatedAt: string;

  expectedResolutionDate?: string;
  assignedTo?: string;            // staff/dept
  response?: string;              // staff response (optional)
  resolutionNotes?: string;       // when resolved/closed

  // Admin/Staff dashboard friendly
  submittedDate?: string;                 // alias of createdAt (yyyy-MM-dd)
  assignedStaff?: string;                 // alias of assignedTo
  priority?: 'Low' | 'Medium' | 'High';
  customerName?: string;                  // display-friendly
  actions: ComplaintAction[];             // service ensures []
}
``
