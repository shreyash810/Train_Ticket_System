
export interface Reservation {
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
  status: 'Confirmed' | 'Cancelled' | 'Pending';
}
``
