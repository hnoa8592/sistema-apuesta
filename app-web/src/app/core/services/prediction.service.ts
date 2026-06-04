import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Prediction } from '../models';

export interface PredictionRequest {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMyPredictions(groupId: string): Observable<Prediction[]> {
    return this.http.get<Prediction[]>(`${this.base}/groups/${groupId}/predictions`);
  }

  submitPrediction(groupId: string, req: PredictionRequest): Observable<Prediction> {
    return this.http.post<Prediction>(`${this.base}/groups/${groupId}/predictions`, req);
  }

  getMatchPredictions(groupId: string, matchId: string): Observable<Prediction[]> {
    return this.http.get<Prediction[]>(`${this.base}/groups/${groupId}/matches/${matchId}/predictions`);
  }
}
