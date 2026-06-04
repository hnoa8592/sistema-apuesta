import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tournament, Match, Page, TournamentStatus, TournamentType, MatchStage, MatchStatus, Team } from '../models';

export interface TournamentFilterParams {
  status?: TournamentStatus[];
  type?: TournamentType;
  page?: number;
  size?: number;
}

export interface MatchFilters {
  stage?: MatchStage;
  status?: MatchStatus;
}

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getTournaments(filters: TournamentFilterParams = {}): Observable<Page<Tournament>> {
    let params = new HttpParams();
    if (filters.status?.length) params = params.set('status', filters.status.join(','));
    if (filters.type) params = params.set('type', filters.type);
    if (filters.page !== undefined) params = params.set('page', String(filters.page));
    if (filters.size !== undefined) params = params.set('size', String(filters.size));
    return this.http.get<Page<Tournament>>(`${this.base}/tournaments`, { params });
  }

  getTournamentById(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.base}/tournaments/${id}`);
  }

  getTournamentMatches(id: string, filters: MatchFilters = {}): Observable<Match[]> {
    let params = new HttpParams();
    if (filters.stage) params = params.set('stage', filters.stage);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<Match[]>(`${this.base}/tournaments/${id}/matches`, { params });
  }

  getTournamentTeams(id: string): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.base}/tournaments/${id}/teams`);
  }
}
