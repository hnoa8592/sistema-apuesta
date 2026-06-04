import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Wildcard, WildcardType } from '../models';

export interface WildcardInput {
  type: WildcardType;
  teamId?: string;
  playerName?: string;
}

export interface WildcardsRequest {
  wildcards: WildcardInput[];
}

@Injectable({ providedIn: 'root' })
export class WildcardService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getWildcards(groupId: string): Observable<Wildcard[]> {
    return this.http.get<Wildcard[]>(`${this.base}/groups/${groupId}/wildcards`);
  }

  updateWildcards(groupId: string, req: WildcardsRequest): Observable<Wildcard[]> {
    return this.http.put<Wildcard[]>(`${this.base}/groups/${groupId}/wildcards`, req);
  }
}
