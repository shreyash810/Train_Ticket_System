
// src/app/core/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** ===== Backend DTOs / Models ===== */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  mobile: string;
  address: string;
  dob: string; // ISO yyyy-MM-dd
  password: string;
}

export interface Passenger {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  dob?: string;   // ISO yyyy-MM-dd
  token?: string; // future JWT from backend (optional)
}

/** ===== Session kept in localStorage =====
 * Back-compat note:
 * - Several components expect `userId: string` (frontend-generated in the old mock).
 * - To avoid refactoring everything now, we derive a stable string from backend id.
 *   Example: id=12 -> userId="UID-12".
 */
export interface SessionState {
  id: number;           // backend primary key
  userId: string;       // back-compat for components (derived)
  name: string;
  email: string;
  loggedInAt: string;
}

type LoginResult = 'OK' | 'LOCKED' | 'INVALID';

interface AuthRecord {
  failedAttempts: number;
  locked: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'railInSession';
  private readonly AUTH_KEY = 'railInAuth';
  private readonly USERS_KEY = 'railInUsers'; // for resetPassword() demo back-compat

  /** Reactive session state used across app */
  sessionSig = signal<SessionState | null>(this.readSessionFromStorage());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ------------------------
  // Storage helpers
  // ------------------------
  private readSessionFromStorage(): SessionState | null {
    const raw = localStorage.getItem(this.SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as SessionState; }
    catch { return null; }
  }

  private loadAuthMap(): Record<string, AuthRecord> {
    const raw = localStorage.getItem(this.AUTH_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw) as Record<string, AuthRecord>; }
    catch { return {}; }
  }

  private saveAuthMap(map: Record<string, AuthRecord>) {
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(map));
  }

  private getOrInitAuth(email: string): AuthRecord {
    const map = this.loadAuthMap();
    if (!map[email]) {
      map[email] = { failedAttempts: 0, locked: false };
      this.saveAuthMap(map);
    }
    return map[email];
  }

  isLocked(email: string): boolean {
    return this.getOrInitAuth(email).locked;
  }

  private clearLock(email: string) {
    const map = this.loadAuthMap();
    if (map[email]) {
      map[email].failedAttempts = 0;
      map[email].locked = false;
      this.saveAuthMap(map);
    }
  }

  private registerFailedAttempt(email: string) {
    const map = this.loadAuthMap();
    const rec = map[email] ?? { failedAttempts: 0, locked: false };
    rec.failedAttempts += 1;
    if (rec.failedAttempts >= 3) rec.locked = true;
    map[email] = rec;
    this.saveAuthMap(map);
  }

  /** Save session (adds a derived userId for back-compat) */
  private setSession(p: Passenger) {
    const session: SessionState = {
      id: p.id,
      userId: `UID-${p.id}`, // back-compat for existing components
      name: p.name,
      email: p.email,
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.sessionSig.set(session);

    // If backend sends a token later, store it for interceptor
    if (p.token) {
      localStorage.setItem('token', p.token);
    }
  }

  /** Public getters used in multiple places */
  getSession(): SessionState | null { return this.sessionSig(); }
  getRole(): 'ADMIN' | 'STAFF' | 'PASSENGER' | null {
    return (localStorage.getItem('role') as any) || null;
  }

  /** Back-compat method used by auth.guard.ts */
  isLoggedIn(): boolean {
    return !!this.sessionSig();
  }

  // ----------------------------------------
  // LOGIN (unified) — preserves your existing UI flow
  // ----------------------------------------
  async login(email: string, password: string): Promise<LoginResult> {
    const e = (email ?? '').trim().toLowerCase();

    // 1) Admin (demo only, UI role gate)
    if (e === 'admin@rail.in' && password === 'Admin@123') {
      localStorage.setItem('role', 'ADMIN');
      return 'OK';
    }

    // 2) Staff (demo only, UI role gate)
    if (e === 'ramesh@rail.in' && password === 'Ramesh@123') {
      localStorage.setItem('role', 'STAFF');
      return 'STAFF_1' as any;
    }

     if (e === 'anita@rail.in' && password === 'Anita@123') {
      localStorage.setItem('role', 'STAFF');
      return 'STAFF_2' as any;
    }


    // 3) Passenger (real backend)
    if (!e) return 'INVALID';
    if (this.isLocked(e)) return 'LOCKED';

    try {
      const payload: LoginRequest = { email: e, password };
      const passenger = await this.http
        .post<Passenger>(`${environment.apiUrl}/passenger/login`, payload)
        .toPromise();

      if (!passenger) {
        this.registerFailedAttempt(e);
        return this.isLocked(e) ? 'LOCKED' : 'INVALID';
      }

      this.clearLock(e);
      this.setSession(passenger);
      localStorage.setItem('role', 'PASSENGER');
      return 'OK';
    } catch {
      this.registerFailedAttempt(e);
      return this.isLocked(e) ? 'LOCKED' : 'INVALID';
    }
  }

  /** Register to backend (for your Register page when you switch it) */
  registerPassenger(input: RegisterRequest) {
    return this.http.post<Passenger>(`${environment.apiUrl}/passenger/register`, input);
  }

  /** Back-compat for Forgot Password page (local demo only) */
  async resetPassword(email: string, newPassword: string): Promise<'OK' | 'NOT_FOUND'> {
    // This preserves the old local demo behavior so the page continues to work.
    // In real backend integration, we will replace this with an API call.
    email = (email ?? '').trim().toLowerCase();
    const usersRaw = localStorage.getItem(this.USERS_KEY);
    const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];

    const idx = users.findIndex(u => (u.email ?? '').toLowerCase() === email);
    if (idx === -1) return 'NOT_FOUND';

    // We are not hashing here because your previous UserService did it.
    // Keep the same expectation: stored value is a hash; for demo, set plain.
    users[idx].passwordHash = newPassword; // demo only; safe to remove later
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    this.clearLock(email);
    return 'OK';
  }

  /** Logout */
  logout() {
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem(this.SESSION_KEY);
    this.sessionSig.set(null);
    this.router.navigate(['/login']);
  }

  /** Small helper used by Edit Profile page */
  updateSessionName(name: string) {
    const session = this.sessionSig();
    if (!session) return;
    const next = { ...session, name };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(next));
    this.sessionSig.set(next);
  }
}
``
