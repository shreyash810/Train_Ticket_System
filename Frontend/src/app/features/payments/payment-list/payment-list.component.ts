
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, PaymentRow } from '../../../core/payment.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css']
})
export class PaymentListComponent implements OnInit {
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  data = signal<PaymentRow[]>([]);
  page = signal<number>(1);
  pageSize = 10;

  constructor(private payments: PaymentService, private auth: AuthService) {}

  ngOnInit(): void {
    const session = this.auth.getSession();
    if (!session?.id) {
      this.error.set('Please log in to view your payments.');
      return;
    }
    this.loading.set(true);
    this.payments.getByPassenger(session.id).subscribe({
      next: rows => { this.data.set(rows || []); this.loading.set(false); },
      error: _ => { this.error.set('Failed to load payments.'); this.loading.set(false); }
    });
  }

  get rowsPaged() {
    const start = (this.page() - 1) * this.pageSize;
    return this.data().slice(start, start + this.pageSize);
  }
  next() { if (this.page() * this.pageSize < this.data().length) this.page.set(this.page() + 1); }
  prev() { if (this.page() > 1) this.page.set(this.page() - 1); }
}
``
