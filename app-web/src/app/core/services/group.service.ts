import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BettingGroup, GroupMember, Leaderboard, InviteCode, GroupAwards } from '../models';

export interface CreateGroupRequest {
  name: string;
  tournamentId: string;
  maxParticipants?: number;
  isOpen: boolean;
  password?: string;
  predictionDeadlineMinutes: number;
  wildcardsEnabled: boolean;
  entryFee?: number;
}

export interface UpdateGroupRequest {
  name?: string;
  password?: string;
  predictionDeadlineMinutes?: number;
}

export interface JoinGroupRequest {
  inviteCode: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMyGroups(): Observable<BettingGroup[]> {
    return this.http.get<BettingGroup[]>(`${this.base}/groups`);
  }

  getExploreGroups(): Observable<BettingGroup[]> {
    return this.http.get<BettingGroup[]>(`${this.base}/groups/explore`);
  }

  getGroupById(id: string): Observable<BettingGroup> {
    return this.http.get<BettingGroup>(`${this.base}/groups/${id}`);
  }

  createGroup(req: CreateGroupRequest): Observable<BettingGroup> {
    return this.http.post<BettingGroup>(`${this.base}/groups`, req);
  }

  updateGroup(id: string, req: UpdateGroupRequest): Observable<BettingGroup> {
    return this.http.put<BettingGroup>(`${this.base}/groups/${id}`, req);
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/groups/${id}`);
  }

  joinGroup(req: JoinGroupRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/groups/join`, req);
  }

  getLeaderboard(groupId: string): Observable<Leaderboard> {
    return this.http.get<Leaderboard>(`${this.base}/groups/${groupId}/leaderboard`);
  }

  getInviteCode(groupId: string): Observable<InviteCode> {
    return this.http.get<InviteCode>(`${this.base}/groups/${groupId}/invite`);
  }

  getMembers(groupId: string): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${this.base}/groups/${groupId}/members`);
  }

  getAwards(groupId: string): Observable<GroupAwards> {
    return this.http.get<GroupAwards>(`${this.base}/groups/${groupId}/awards`);
  }
}
