
import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';

/**
 * Passenger user record persisted in localStorage.
 * NOTE: For ILP demo only. In real apps, never store user data or hashes on the client.
 */
export interface PassengerUser {
  userId: string;      // Generated username (e.g., UID-<base36>-<rnd>)
  name: string;
  email: string;       // unique (lowercased)
  countryCode: string; // e.g., +91
  mobile: string;      // numeric string
  address: string;
  dob: string;         // ISO yyyy-MM-dd
  passwordHash: string;// SHA-256 hash (frontend demo)
  createdAt: string;   // ISO timestamp
}

@Injectable({ providedIn: 'root' })
export class UserService {
  /** LocalStorage bucket key for users array */
  private readonly LS_KEY = 'railInUsers';

  // ----------------------------
  // Storage helpers
  // ----------------------------

  /** Read all users from localStorage */
  getUsers(): PassengerUser[] {
    const raw = localStorage.getItem(this.LS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PassengerUser[];
    } catch {
      // If parsing fails, reset the bucket to avoid cascading errors
      localStorage.removeItem(this.LS_KEY);
      return [];
    }
  }

  /** Persist full users list into localStorage */
  private setUsers(users: PassengerUser[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(users));
  }

  // ----------------------------
  // Uniqueness checks
  // ----------------------------

  /** Is email already registered? (case-insensitive) */
  isEmailTaken(email: string): boolean {
    const e = (email ?? '').trim().toLowerCase();
    return this.getUsers().some(u => u.email === e);
  }

  /** Is (countryCode, mobile) combination already registered? */
  isMobileTaken(countryCode: string, mobile: string): boolean {
    const cc = (countryCode ?? '').trim();
    const m = (mobile ?? '').trim();
    if (!cc || !m) return false;
    return this.getUsers().some(u => u.countryCode === cc && u.mobile === m);
  }

  /**
   * For Edit Profile: is (countryCode, mobile) taken by another user (exclude current userId)?
   */
  isMobileTakenByAnother(countryCode: string, mobile: string, excludeUserId: string): boolean {
    const cc = (countryCode ?? '').trim();
    const m = (mobile ?? '').trim();
    const uid = (excludeUserId ?? '').trim();
    if (!cc || !m) return false;
    return this.getUsers().some(u => u.countryCode === cc && u.mobile === m && u.userId !== uid);
  }

  // ----------------------------
  // Async validators (Reactive Forms)
  // ----------------------------

  /** Async validator: email must be unique */
  emailUniqueValidator(): AsyncValidatorFn {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      const value = (control.value ?? '').trim().toLowerCase();
      if (!value) return null; // let required/email validators handle empties
      // Simulate network latency in demo
      await new Promise(res => setTimeout(res, 250));
      return this.isEmailTaken(value) ? { emailTaken: true } : null;
    };
  }

  /**
   * Async validator: mobile must be unique for the selected countryCode
   * (assumes `countryCode` is a sibling control in the same form group)
   */
  mobileUniqueValidator(): AsyncValidatorFn {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      const mobile = (control.value ?? '').trim();
      const countryCode = control.parent?.get('countryCode')?.value ?? '';
      if (!mobile || !countryCode) return null; // let required/pattern validators handle empties
      await new Promise(res => setTimeout(res, 250));
      return this.isMobileTaken(countryCode, mobile) ? { mobileTaken: true } : null;
    };
  }

  // ----------------------------
  // Security (demo): hash & ID
  // ----------------------------

  /**
   * Compute SHA-256 hash (hex) for the given string via Web Crypto.
   * NOTE: For demo only. Use bcrypt/Argon2 on a backend in production!
   */
  async hashPassword(plain: string): Promise<string> {
    const enc = new TextEncoder().encode(plain ?? '');
    const digest = await crypto.subtle.digest('SHA-256', enc);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** Generate a random user ID (used as username) */
  generateUserId(): string {
    const ts = Date.now().toString(36);
    const rnd = Math.floor(Math.random() * 1e9).toString(36);
    return `UID-${ts}-${rnd}`.toUpperCase();
  }

  // ----------------------------
  // Registration
  // ----------------------------

  /**
   * Register a user with duplicate checks and password hashing.
   * Throws:
   *  - Error('EMAIL_DUPLICATE') if email already registered
   *  - Error('MOBILE_DUPLICATE') if mobile (with country code) already registered
   */
  async registerUser(input: {
    name: string;
    email: string;
    countryCode: string;
    mobile: string;
    address: string;
    dob: string;       // yyyy-MM-dd
    password: string;
  }): Promise<PassengerUser> {
    const name = (input.name ?? '').trim();
    const email = (input.email ?? '').trim().toLowerCase();
    const countryCode = (input.countryCode ?? '').trim();
    const mobile = (input.mobile ?? '').trim();
    const address = (input.address ?? '').trim();
    const dob = (input.dob ?? '').trim();

    // Duplicate checks
    if (this.isEmailTaken(email)) {
      throw new Error('EMAIL_DUPLICATE');
    }
    if (this.isMobileTaken(countryCode, mobile)) {
      throw new Error('MOBILE_DUPLICATE');
    }

    const passwordHash = await this.hashPassword(input.password ?? '');

    const user: PassengerUser = {
      userId: this.generateUserId(),
      name,
      email,
      countryCode,
      mobile,
      address,
      dob,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    const users = this.getUsers();
    users.push(user);
    this.setUsers(users);

    return user;
  }

  // ----------------------------
  // Profile update (Edit Profile)
  // ----------------------------

  /**
   * Update editable fields (name, countryCode, mobile, address).
   * Enforces uniqueness for (countryCode, mobile) excluding current user.
   * Throws:
   *  - Error('MOBILE_DUPLICATE') when new mobile is already used by another user.
   * Returns the updated user or null if not found.
   */
  updateUserProfile(userId: string, updates: {
    name?: string;
    countryCode?: string;
    mobile?: string;
    address?: string;
  }): PassengerUser | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId === (userId ?? '').trim());
    if (idx === -1) return null;

    const current = users[idx];

    // If mobile & countryCode are provided (changed), ensure uniqueness against others
    if (updates.countryCode && updates.mobile) {
      if (this.isMobileTakenByAnother(updates.countryCode, updates.mobile, current.userId)) {
        throw new Error('MOBILE_DUPLICATE');
      }
    }

    const updated: PassengerUser = {
      ...current,
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(updates.countryCode ? { countryCode: updates.countryCode.trim() } : {}),
      ...(updates.mobile ? { mobile: updates.mobile.trim() } : {}),
      ...(updates.address ? { address: updates.address.trim() } : {})
    };

    users[idx] = updated;
    this.setUsers(users);
    return updated;
  }
}
