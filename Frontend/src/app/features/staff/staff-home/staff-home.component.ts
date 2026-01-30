
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ add this

@Component({
  selector: 'app-staff-home',
  standalone: true,
  imports: [CommonModule, RouterModule], // ✅ include RouterModule
  template: `
    <div class="wrap">
      <h2>Staff Home</h2>
      <p>Welcome to the staff portal.</p>

      <div class="actions">
        <a class="btn" routerLink="/staff/complaints">Manage Complaints</a>
      </div>
    </div>
  `,
  styles: [`
    :host { --brand: #1e3a8a; }
    .wrap { max-width: 900px; margin: 24px auto; padding: 16px; border:1px solid #e6e9ef; border-radius: 12px; background:#fff; }
    .actions { margin-top: 16px; }
    .btn {
      display:inline-block; padding:10px 14px; border-radius:8px;
      background: var(--brand); color:#fff; text-decoration:none; font-weight:600;
      border: none;
    }
    .btn:hover { background:#163375; }
  `]
})
export class StaffHomeComponent {}
