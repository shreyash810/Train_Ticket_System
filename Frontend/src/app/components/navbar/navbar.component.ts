
import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isLoggedIn = computed(() => !!this.auth.sessionSig());
  userName = computed(() => this.auth.sessionSig()?.name ?? '');

  constructor(private auth: AuthService) {}

  logout() { this.auth.logout(); }
}
