
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PassengerService, PassengerDto } from '../../core/passenger.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent {
  user = signal<PassengerDto | null>(null);
  error = signal<string | null>(null);
  loading = signal<boolean>(false);

  constructor(private auth: AuthService, private passengers: PassengerService) {
    const session = this.auth.getSession();
    if (!session?.id) {
      this.error.set('Please log in to view your profile.');
      return;
    }
    this.loading.set(true);
    this.passengers.getById(session.id).subscribe({
      next: u => { this.user.set(u); this.loading.set(false); },
      error: _ => { this.error.set('Failed to load profile.'); this.loading.set(false); }
    });
  }
}
