
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';          // ✅ add this
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],                 // ✅ include here
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  userName = signal<string>('');

  constructor(private auth: AuthService) {
    this.userName.set(this.auth.sessionSig()?.name ?? '');
  }
}
