import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserStats } from '../models';

export interface UpdateProfileRequest {
  phone?: string;
  contactEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/users/me`);
  }

  updateProfile(req: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/users/me`, req);
  }

  sendVerificationEmail(): Observable<void> {
    return this.http.post<void>(`${this.base}/users/me/verify-email`, {});
  }

  getStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.base}/users/me/stats`);
  }
}
