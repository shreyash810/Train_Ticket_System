
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { passwordStrengthValidator, matchPasswordsValidator } from '../../shared/form-validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  form!: FormGroup;
  submitting = signal(false);
  message = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: [matchPasswordsValidator('newPassword', 'confirmPassword')] });
  }

  get f() { return this.form.controls; }

  async onReset() {
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const v = this.form.value;
    const res = await this.auth.resetPassword(v['email'], v['newPassword']);
    if (res === 'OK') {
      this.message.set('Password updated. You can now log in.');
      setTimeout(() => this.router.navigate(['/login']), 800);
    } else {
      this.message.set('Account not found for the provided email.');
    }
    this.submitting.set(false);
  }
}
