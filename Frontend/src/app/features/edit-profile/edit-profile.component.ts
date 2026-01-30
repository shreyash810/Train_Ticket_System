
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PassengerService, PassengerDto } from '../../core/passenger.service';
import { addressMinLengthValidator, mobileValidator, nameValidator } from '../../shared/form-validators';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent {
  form!: FormGroup;
  user = signal<PassengerDto | null>(null);
  message = signal<string | null>(null);
  saving = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private passengers: PassengerService,
    private router: Router
  ) {
    const session = this.auth.getSession();
    if (!session?.id) {
      this.message.set('Please log in to edit your profile.');
      return;
    }

    this.form = this.fb.group({
      name: ['', [nameValidator()]],
      mobile: ['', [mobileValidator()]],
      address: ['', [addressMinLengthValidator(10)]],
      // read-only display
      email: [{ value: '', disabled: true }],
      id: [{ value: '', disabled: true }],
      dob: [{ value: '', disabled: true }],
    });

    this.passengers.getById(session.id).subscribe({
      next: u => {
        this.user.set(u);
        this.form.patchValue({
          name: u.name,
          mobile: u.mobile,
          address: u.address,
          email: u.email,
          id: u.id,
          dob: u.dob
        });
      },
      error: _ => this.message.set('Failed to load profile.')
    });
  }

  get f() { return this.form.controls; }

  onSave() {
    this.message.set(null);
    if (this.form.invalid || !this.user()) {
      this.form.markAllAsTouched();
      return;
    }
    const session = this.auth.getSession();
    if (!session?.id) return;

    this.saving.set(true);
    const v = this.form.getRawValue();
    this.passengers.update(session.id, {
      name: v['name'],
      mobile: v['mobile'],
      address: v['address']
    }).subscribe({
      next: u => {
        // Keep navbar greeting updated
        this.auth.updateSessionName(u.name);
        this.message.set('Your profile has been updated successfully.');
        setTimeout(() => this.router.navigate(['/my-profile']), 700);
      },
      error: _ => this.message.set('Update failed. Please try again.'),
      complete: () => this.saving.set(false)
    });
  }
}
