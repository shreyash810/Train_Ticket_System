
// src/app/core/user.service.ts
import { Injectable } from '@angular/core';
import { AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export interface PassengerUser {
  userId: string;
  name: string;
  email: string;
  countryCode: string;
  mobile: string;
  address: string;
  dob: string; // ISO yyyy-MM-dd
  passwordHash: string; // store hash, not plain
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private LS_KEY = 'railInUsers';

  /** Get all users from localStorage */
  getUsers(): PassengerUser[] {
    const raw = localStorage.getItem(this.LS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PassengerUser[];
    } catch {
      return [];
    }
  }

  /** Save full list */
  private setUsers(users: PassengerUser[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(users));
  }

  isEmailTaken(email: string): boolean {
    return this.getUsers().some(u => u.email.toLowerCase() === (email ?? '').toLowerCase());
  }

  isMobileTaken(countryCode: string, mobile: string): boolean {
    return this.getUsers().some(u => u.countryCode === countryCode && u.mobile === mobile);
  }

  /** Async validator for unique email (works on blur) */
  emailUniqueValidator(): AsyncValidatorFn {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      const value = (control.value ?? '').trim();
      if (!value) return null; // let required/email cover this
      // simulate latency
      await new Promise(res => setTimeout(res, 250));
      return this.isEmailTaken(value) ? { emailTaken: true } : null;
    };
  }

  /** Async validator for unique mobile (considers countryCode from parent) */
  mobileUniqueValidator(): AsyncValidatorFn {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      const mobile = (control.value ?? '').trim();
      const countryCode = control.parent?.get('countryCode')?.value ?? '';
      if (!mobile || !countryCode) return null; // let required/mobile pattern cover this
      await new Promise(res => setTimeout(res, 250));
      return this.isMobileTaken(countryCode, mobile) ? { mobileTaken: true } : null;
    };
  }

  /** SHA-256 hash (hex) using Web Crypto */
  async hashPassword(plain: string): Promise<string> {
    const enc = new TextEncoder().encode(plain);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** Generate random User ID */
  generateUserId(): string {
    const ts = Date.now().toString(36);
    const rnd = Math.floor(Math.random() * 1e9).toString(36);
    return `UID-${ts}-${rnd}`.toUpperCase();
  }

  /** Register user (throws errors for duplicates) */
  async registerUser(input: {
    name: string;
    email: string;
    countryCode: string;
    mobile: string;
    address: string;
    dob: string;
    password: string;
  }): Promise<PassengerUser> {
    const { name, email, countryCode, mobile, address, dob, password } = input;

    // duplicate checks
    if (this.isEmailTaken(email)) {
      throw new Error('EMAIL_DUPLICATE');
    }
    if (this.isMobileTaken(countryCode, mobile)) {
      throw new Error('MOBILE_DUPLICATE');
    }

    const passwordHash = await this.hashPassword(password);
    const user: PassengerUser = {
      userId: this.generateUserId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      countryCode,
      mobile: mobile.trim(),
      address: address.trim(),
      dob,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    const users = this.getUsers();
    users.push(user);
    this.setUsers(users);

    return user;
  }
}
