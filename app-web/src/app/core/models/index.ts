// ─── Enums ────────────────────────────────────────────────────────────────────

export type TournamentType =
  | 'WORLD_CUP' | 'CHAMPIONS_LEAGUE' | 'COPA_AMERICA'
  | 'EUROPA_LEAGUE' | 'NATIONAL_LEAGUE' | 'OTHER';

export type TournamentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'SUSPENDED';

export type MatchStage =
  | 'GROUP' | 'ROUND_OF_16' | 'QUARTER_FINAL'
  | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL';

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export type GroupStatus = 'OPEN' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

export type MemberRole = 'ORGANIZER' | 'PARTICIPANT';

export type WildcardType =
  | 'FINALIST_1' | 'FINALIST_2' | 'BEST_PLAYER'
  | 'BEST_GOALKEEPER' | 'TOP_SCORER';

// ─── Domain Models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  pictureUrl?: string;
  phone?: string;
  contactEmail?: string;
  emailVerified: boolean;
  isProfileComplete: boolean;
}

export interface UserStats {
  tournamentsPlayed: number;
  tournamentsWon: number;
  totalPoints: number;
  pointsThisMonth: number;
  correctResultRate: number;
  exactScores: number;
  currentStreak: number;
  predictionsTotal: number;
  predictionsExact: number;
  predictionsCorrect: number;
}

export interface Tournament {
  id: string;
  externalId: string;
  name: string;
  shortName?: string;
  type: TournamentType;
  status: TournamentStatus;
  startDate?: string;
  endDate?: string;
  season?: string;
  hasPhases: boolean;
  logoUrl?: string;
  country?: string;
}

export interface Team {
  id: string;
  externalId: string;
  name: string;
  shortName?: string;
  country?: string;
  flagUrl?: string;
}

export interface Match {
  id: string;
  externalId: string;
  tournamentId: string;
  homeTeam: Team;
  awayTeam: Team;
  scheduledAt: string;
  stage: MatchStage;
  groupName?: string;
  matchDay?: number;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  decidedByPenalties: boolean;
}

export interface BettingGroup {
  id: string;
  name: string;
  tournament: Tournament;
  organizerId: string;
  organizerName?: string;
  maxParticipants?: number;
  isOpen: boolean;
  predictionDeadlineMinutes: number;
  wildcardsEnabled: boolean;
  entryFee?: number;
  inviteCode: string;
  status: GroupStatus;
  myPosition?: number;
  myPoints?: number;
  totalParticipants: number;
  myExactPredictions?: number;
  myCorrectPredictions?: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  name: string;
  pictureUrl?: string;
  email: string;
  role: MemberRole;
  totalPoints: number;
  joinedAt: string;
  hasPaid?: boolean;
}

export interface LeaderboardEntry {
  position: number;
  userId: string;
  name: string;
  pictureUrl?: string;
  totalPoints: number;
  exactPredictions: number;
  correctResults: number;
  positionTrend: number;
  isCurrentUser: boolean;
}

export interface Leaderboard {
  groupId: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
}

export interface Prediction {
  id: string;
  groupId: string;
  matchId: string;
  homeScorePred: number;
  awayScorePred: number;
  pointsEarned?: number;
  submittedAt: string;
  isDraft?: boolean;
}

export interface Wildcard {
  id?: string;
  groupId: string;
  type: WildcardType;
  teamId?: string;
  teamName?: string;
  playerName?: string;
  pointsEarned?: number;
  isLocked: boolean;
}

export interface AwardEntry {
  position: number;
  userId: string;
  name: string;
  pictureUrl?: string;
  points: number;
  percentage: number;
  amount: number;
}

export interface GroupAwards {
  groupId: string;
  tournamentFinished: boolean;
  totalPool: number;
  prizes: AwardEntry[];
  organizerCommission: { percentage: number; amount: number };
}

export interface InviteCode {
  inviteCode: string;
  inviteUrl: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: { label: string; fn: () => void };
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

export const STAGE_POINTS: Record<MatchStage, { correctResult: number; exactScore: number }> = {
  GROUP:          { correctResult: 1, exactScore: 3 },
  ROUND_OF_16:    { correctResult: 3, exactScore: 5 },
  QUARTER_FINAL:  { correctResult: 5, exactScore: 8 },
  SEMI_FINAL:     { correctResult: 7, exactScore: 10 },
  THIRD_PLACE:    { correctResult: 8, exactScore: 12 },
  FINAL:          { correctResult: 10, exactScore: 15 },
};

export const TOURNAMENT_TYPE_LABEL: Record<TournamentType, string> = {
  WORLD_CUP:          'Mundial',
  CHAMPIONS_LEAGUE:   'Champions League',
  COPA_AMERICA:       'Copa América',
  EUROPA_LEAGUE:      'Europa League',
  NATIONAL_LEAGUE:    'Liga Nacional',
  OTHER:              'Torneo',
};

export const STAGE_LABEL: Record<MatchStage, string> = {
  GROUP:          'Fase de Grupos',
  ROUND_OF_16:    'Octavos de Final',
  QUARTER_FINAL:  'Cuartos de Final',
  SEMI_FINAL:     'Semifinal',
  THIRD_PLACE:    'Tercer Puesto',
  FINAL:          'Final',
};

export const WILDCARD_LABEL: Record<WildcardType, string> = {
  FINALIST_1:       'Selección a la final #1',
  FINALIST_2:       'Selección a la final #2',
  BEST_PLAYER:      'Mejor jugador',
  BEST_GOALKEEPER:  'Mejor portero',
  TOP_SCORER:       'Goleador del torneo',
};
export type UserRole = 'USER' | 'ADMIN';
