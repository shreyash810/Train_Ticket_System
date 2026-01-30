
// src/app/shared/form-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Name: min 3, letters & spaces only */
export function nameValidator(): ValidatorFn {
  const regex = /^[A-Za-z ]{3,}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return { required: true };
    return regex.test(value) ? null : { nameInvalid: true };
  };
}

/** Mobile: digits only, length 8-10 */
export function mobileValidator(): ValidatorFn {
  const regex = /^[6-9]\d{9}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return { required: true };
    return regex.test(value) ? null : { mobileInvalid: true };
  };
}

/** Address: min 10 chars */
export function addressMinLengthValidator(min = 10): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return { required: true };
    return value.length >= min ? null : { addressTooShort: true };
  };
}

/** Password strength: min 8, at least 1 upper, 1 lower, 1 digit, 1 special */
export function passwordStrengthValidator(): ValidatorFn {
  const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value ?? '';
    if (!value) return { required: true };
    return regex.test(value) ? null : { weakPassword: true };
  };
}

/** Match password & confirmPassword on the form group */
export function matchPasswordsValidator(passwordKey = 'password', confirmKey = 'confirmPassword'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value ?? '';
    const confirm = group.get(confirmKey)?.value ?? '';
    if (!password || !confirm) return null; // let individual controls show required
    return password === confirm ? null : { passwordsMismatch: true };
  };
}

/** Adult (>= minAge years) */

export function adultValidator(minAgeYears = 18, maxAgeYears = 70): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (!raw) return { required: true };

    const dob = new Date(raw);
    if (isNaN(dob.getTime())) return { invalidDate: true };

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < minAgeYears) return { tooYoung: true };
    if (age > maxAgeYears) return { tooOld: true };

    return null;
  };
}

