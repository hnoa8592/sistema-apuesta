import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../../core/models';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UpdateRoleRequest {
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/admin/users`);
  }

  updateUserRole(userId: string, role: UserRole): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/admin/users/${userId}/role`, { role });
  }

  getTournaments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/tournaments`);
  }

  createTournament(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/tournaments`, data);
  }

  updateTournament(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/admin/tournaments/${id}`, data);
  }

  deleteTournament(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/tournaments/${id}`);
  }

  getTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/teams`);
  }

  createTeam(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/teams`, data);
  }

  updateTeam(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/admin/teams/${id}`, data);
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/teams/${id}`);
  }

  // Sync endpoints
  syncTournaments(): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/sync/tournaments`, {});
  }

  syncFixtures(): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/sync/fixtures`, {});
  }

  syncScoring(): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/sync/scoring`, {});
  }

  syncAll(): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/sync/all`, {});
  }
}