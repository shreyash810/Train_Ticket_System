
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.css']
})
export class StaffLoginComponent {
  form!: FormGroup;
  submitting = signal(false);
  message = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get f() { return this.form.controls; }

  async onLogin() {
    this.message.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    try {
      const result = await this.auth.login(this.f['email'].value, this.f['password'].value);
      if (result === ('STAFF_1' as any)) {
        // Demo: set seeded staffId = 1 (Ramesh). Change if needed.
        localStorage.setItem('staffId', '1');
        this.router.navigate(['/staff']);
      }
      else if(result === ('STAFF_2' as any)){
       localStorage.setItem('staffId', '2');
        this.router.navigate(['/staff']); 
      } else if (result === 'LOCKED') {
        this.message.set('Your account is locked. Please contact support.');
      } else {
        this.message.set('Invalid email or password.');
      }
    } catch {
      this.message.set('Login failed. Please try again later.');
    } finally {
      this.submitting.set(false);
    }
  }
}
