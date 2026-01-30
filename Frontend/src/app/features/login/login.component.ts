
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form!: FormGroup;
  submitting = signal(false);
  message = signal<string | null>(null); // shows error/success messages

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get f() { return this.form.controls; }

  async onLogin() {
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const email = this.f['email'].value;
    const password = this.f['password'].value;

    try {
      const result = await this.auth.login(email, password);
      if (result === 'OK') {
        // Navigate to home (we'll implement Home next)
        this.router.navigate(['/home']); // temporary: create home later, or point to '/'
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
