import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';
import { GoogleIdentityService } from './google-identity.service';
import { User } from '../models';
import { UserService } from '../services/user.service';

const TOKEN_KEY = 'tecnoa_auth_token';
const USER_KEY  = 'tecnoa_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authApi = inject(AuthApiService);
  private userService = inject(UserService);
  private googleId = inject(GoogleIdentityService);
  private router = inject(Router);

  private _user   = signal<User | null>(this._loadUser());
  private _token  = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _loading = signal(false);

  readonly user    = this._user.asReadonly();
  readonly token   = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isProfileComplete = computed(() => this._user()?.emailVerified ?? false);

  private _loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  loginWithGoogle(idToken: string): Observable<{ accessToken: string; user: User }> {
    this._loading.set(true);
    return this.authApi.loginWithGoogle(idToken).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this._token.set(res.accessToken);
        this._user.set(res.user);
        this._loading.set(false);
      }),
    );
  }

  login(request: { email: string; password: string }): Observable<{ accessToken: string; user: User }> {
    this._loading.set(true);
    return this.authApi.login(request).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this._token.set(res.accessToken);
        this._user.set(res.user);
        this._loading.set(false);
      }),
    );
  }

  register(request: { name: string; email: string; password: string }): Observable<{ accessToken: string; user: User }> {
    this._loading.set(true);
    return this.authApi.register(request).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this._token.set(res.accessToken);
        this._user.set(res.user);
        this._loading.set(false);
      }),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.authApi.forgotPassword({ email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.authApi.resetPassword({ token, newPassword });
  }

  logout(): void {
    const user = this._user();
    if (user?.email) this.googleId.revoke(user.email);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  refreshProfile(): void {
    if (!this._token()) return;
    this.userService.getProfile().subscribe({
      next: user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
      },
    });
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }
}