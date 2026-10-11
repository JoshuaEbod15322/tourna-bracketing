import React from 'react';
import { Trophy, Check, Edit3, RotateCcw } from 'lucide-react';
import { Match, Team } from '../../types/tournament';

interface MatchCardProps {
  match: Match;
  teams: Team[];
  onOpenScore: (match: Match) => void;
  onResetMatch?: (matchId: string) => void;
  compact?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  teams,
  onOpenScore,
  onResetMatch,
  compact = false,
}) => {
  const teamMap = new Map(teams.map(t => [t.id, t]));

  const team1 = match.team1Id ? teamMap.get(match.team1Id) : null;
  const team2 = match.team2Id ? teamMap.get(match.team2Id) : null;

  const isCompleted = match.status === 'completed';
  const isBye = match.status === 'bye';
  const isReady = match.status === 'ready';

  const isTeam1Winner = !isBye && match.winnerId !== null && match.winnerId === match.team1Id;
  const isTeam2Winner = !isBye && match.winnerId !== null && match.winnerId === match.team2Id;

  const formattedRoundName = match.roundName
    ? match.roundName.replace(/^(Losers|Winners)\s+/i, '')
    : '';

  return (
    <div
      className={`relative w-64 h-[128px] flex flex-col justify-between bg-white dark:bg-slate-900 border ${
        isCompleted
          ? 'border-slate-300 dark:border-slate-700 shadow-sm'
          : isReady
          ? 'border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
          : 'border-slate-200 dark:border-slate-800'
      } rounded-xl overflow-hidden transition-all text-xs shrink-0 select-none`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800/80 text-[11px] h-6">
        <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
          M#{match.matchNumber} · {formattedRoundName}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isBye && (
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              BYE
            </span>
          )}
          {isCompleted && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-0.5">
              <Check className="w-3 h-3" />
              Final
            </span>
          )}
          {isReady && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Ready
            </span>
          )}
          {match.status === 'pending' && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              TBD
            </span>
          )}
        </div>
      </div>

      {/* Team 1 Slot */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/60 transition-colors h-[38px] ${
          isTeam1Winner
            ? 'bg-emerald-50/70 dark:bg-emerald-950/25 text-slate-900 dark:text-white font-semibold'
            : !isBye && match.winnerId && !isTeam1Winner
            ? 'opacity-60 text-slate-500 dark:text-slate-400'
            : 'text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {team1 ? (
            <>
              <div
                className="w-4 h-4 rounded text-[10px] font-mono font-bold text-white flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: team1.badgeColor || '#3B82F6' }}
              >
                {team1.seed}
              </div>
              <span className="truncate">{team1.name}</span>
              {match.team1ByeAdvance && !isCompleted && (
                <span
                  className="text-[9px] font-bold px-1 py-px rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0"
                  title="Advanced automatically via BYE — hasn't played yet"
                >
                  BYE
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic truncate text-[11px]">
              {match.team1Placeholder || 'Pending opponent'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isTeam1Winner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
          <span className="font-mono font-bold text-sm tabular-nums w-6 text-right">
            {match.team1Score !== null ? match.team1Score : '-'}
          </span>
        </div>
      </div>

      {/* Team 2 Slot */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 transition-colors h-[38px] ${
          isTeam2Winner
            ? 'bg-emerald-50/70 dark:bg-emerald-950/25 text-slate-900 dark:text-white font-semibold'
            : !isBye && match.winnerId && !isTeam2Winner
            ? 'opacity-60 text-slate-500 dark:text-slate-400'
            : 'text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {team2 ? (
            <>
              <div
                className="w-4 h-4 rounded text-[10px] font-mono font-bold text-white flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: team2.badgeColor || '#3B82F6' }}
              >
                {team2.seed}
              </div>
              <span className="truncate">{team2.name}</span>
              {match.team2ByeAdvance && !isCompleted && (
                <span
                  className="text-[9px] font-bold px-1 py-px rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0"
                  title="Advanced automatically via BYE — hasn't played yet"
                >
                  BYE
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic truncate text-[11px]">
              {match.team2Placeholder || 'Pending opponent'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isTeam2Winner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
          <span className="font-mono font-bold text-sm tabular-nums w-6 text-right">
            {match.team2Score !== null ? match.team2Score : '-'}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/60 h-6">
        {(isReady || isCompleted) && !isBye ? (
          <>
            <button
              onClick={() => onOpenScore(match)}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isCompleted ? 'Edit Score' : 'Enter Score'}</span>
            </button>

            {isCompleted && onResetMatch && (
              <button
                onClick={() => onResetMatch(match.id)}
                className="text-slate-400 hover:text-amber-500 p-0.5 rounded transition-colors"
                title="Reset match result"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          <span className="text-[10px] text-slate-400 italic">
            {isBye ? 'Automatic Bye' : 'Awaiting Opponents'}
          </span>
        )}
      </div>
    </div>
  );
};
