
// src/app/features/register/register.component.ts
import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../../core/auth.service';
import {
  nameValidator,
  mobileValidator,
  addressMinLengthValidator,
  passwordStrengthValidator,
  matchPasswordsValidator,
  adultValidator
} from '../../shared/form-validators';
import { UserService, PassengerUser } from '../../core/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // Functional DI (available during field initialization)
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private auth = inject(AuthService);

  maxDob = this.computeMaxDob();
  minDob = this.computeMinDob();

  submitting = signal(false);
  submitError = signal<string | null>(null);

  registeredUser = signal<PassengerUser | null>(null);
  showSuccess = computed(() => this.registeredUser() !== null);

  form = this.fb.group({
    name: ['', [nameValidator()]],
    email: ['', [Validators.required, Validators.email], [this.userService.emailUniqueValidator()]],
    countryCode: ['', [Validators.required]],
    mobile: ['', [mobileValidator()], [this.userService.mobileUniqueValidator()]],
    address: ['', [addressMinLengthValidator(10)]],
    dob: ['', [adultValidator(18)]],
    password: ['', [passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: [matchPasswordsValidator('password', 'confirmPassword')] });

  private computeMaxDob(): string {
    const today = new Date();
    const max = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const yyyy = max.getFullYear();
    const mm = String(max.getMonth() + 1).padStart(2, '0');
    const dd = String(max.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

 
private computeMinDob(): string {
  const today = new Date();
  const min = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate());
  const yyyy = min.getFullYear();
  const mm = String(min.getMonth() + 1).padStart(2, '0');
  const dd = String(min.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async onRegister() {
  this.submitError.set(null);
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.submitting.set(true);
  const v = this.form.value;

  // Build backend payload (concat countryCode + mobile)
  const payload: RegisterRequest = {
    name: v.name!,
    email: v.email!.toLowerCase(),
    mobile: `${v.countryCode}${v.mobile}`.replace(/\s+/g, ''),
    address: v.address!,
    dob: v.dob!,         // yyyy-MM-dd
    password: v.password!
  };

  try {
    // Call the real backend
    const passenger = await this.auth.registerPassenger(payload).toPromise();

    // Option A (recommended): redirect to login (clean flow)
    // this.router.navigate(['/login']);
    // return;

    // Option B: keep your "success" UI without touching the template.
    // We'll set a lightweight "registeredUser" just for display.
    this.registeredUser.set({
      userId: 'PENDING-UID',          // display only; not used for login
      name: v.name!,
      email: v.email!.toLowerCase(),
      countryCode: v.countryCode!,
      mobile: v.mobile!,
      address: v.address!,
      dob: v.dob!,
      passwordHash: 'BACKEND-SAVED',   // placeholder; we don’t store hash on client now
      createdAt: new Date().toISOString()
    });

    this.form.reset();
  } catch (err: any) {
    // Server responses now include messages (we enabled include-message in application.yml)
    const msg = err?.error?.message || '';
    if (msg.toLowerCase().includes('email')) {
      this.submitError.set('Email already registered');
      this.form.get('email')?.setErrors({ emailTaken: true });
    } else if (msg.toLowerCase().includes('mobile')) {
      this.submitError.set('Mobile number already registered');
      this.form.get('mobile')?.setErrors({ mobileTaken: true });
    } else {
      this.submitError.set('Registration failed. Please try again.');
    }
  } finally {
    this.submitting.set(false);
  }
}


  onReset() {
    this.form.reset();
    this.submitError.set(null);
    this.registeredUser.set(null);
  }

  goToLogin() {
    this.registeredUser.set(null);
    this.router.navigate(['/login']);
  }

  get f() { return this.form.controls; }
}
