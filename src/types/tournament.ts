export type TournamentFormat = 'single_elimination' | 'double_elimination';

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

export type MatchStatus = 'pending' | 'ready' | 'ongoing' | 'completed' | 'bye';

export type BracketType = 'single' | 'winners' | 'losers' | 'grand_final';

export type ScoreType = 'points' | 'games' | 'manual';

export interface Team {
  id: string;
  name: string;
  seed: number;
  createdAt: string;
  losses: number;
  badgeColor?: string;
}

export interface Match {
  id: string;
  matchNumber: number;
  tournamentId: string;
  bracketType: BracketType;
  roundNumber: number;
  roundName: string;
  team1Id: string | null;
  team2Id: string | null;
  team1Placeholder?: string;
  team2Placeholder?: string;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
  loserId: string | null;
  /** True when the team arrived in this slot via an automatic BYE advance (not a played win). */
  team1ByeAdvance?: boolean;
  team2ByeAdvance?: boolean;
  status: MatchStatus;
  nextMatchId: string | null;
  nextMatchSlot?: 'team1' | 'team2';
  loserNextMatchId?: string | null;
  loserNextMatchSlot?: 'team1' | 'team2';
  completedAt?: string;
}

export interface TournamentSettings {
  format: TournamentFormat;
  scoreType: ScoreType;
  seedingMethod: 'standard' | 'random' | 'manual';
  minTeams?: number;
  maxTeams?: number;
}

export interface Tournament {
  id: string;
  name: string;
  gameOrSport: string;
  description?: string;
  organizer?: string;
  tournamentDate?: string;
  status: TournamentStatus;
  settings: TournamentSettings;
  teams: Team[];
  matches: Match[];
  championTeamId: string | null;
  runnerUpTeamId?: string | null;
  bracketGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationData {
  version: string;
  tournaments: Tournament[];
  lastActiveTournamentId?: string;
  exportedAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
