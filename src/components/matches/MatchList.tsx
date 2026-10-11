import React, { useState } from 'react';
import { Search, Trophy, Check, Edit3, RotateCcw } from 'lucide-react';
import { Match, MatchStatus, Tournament } from '../../types/tournament';

interface MatchListProps {
  tournament: Tournament;
  onOpenScore: (match: Match) => void;
  onResetMatch: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  tournament,
  onOpenScore,
  onResetMatch,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus>('all');
  const [bracketFilter, setBracketFilter] = useState<'all' | 'single' | 'winners' | 'losers' | 'grand_final'>('all');

  const teamMap = new Map(tournament.teams.map(t => [t.id, t]));

  const filteredMatches = tournament.matches.filter(m => {
    // Status filter
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;

    // Bracket filter
    if (bracketFilter !== 'all') {
      if (bracketFilter === 'grand_final') {
        if (m.bracketType !== 'grand_final') return false;
      } else if (m.bracketType !== bracketFilter) {
        return false;
      }
    }

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const t1Name = m.team1Id ? teamMap.get(m.team1Id)?.name.toLowerCase() : m.team1Placeholder?.toLowerCase();
      const t2Name = m.team2Id ? teamMap.get(m.team2Id)?.name.toLowerCase() : m.team2Placeholder?.toLowerCase();
      const round = m.roundName.toLowerCase();
      const matchNum = `m#${m.matchNumber}`.toLowerCase();

      return (
        (t1Name && t1Name.includes(q)) ||
        (t2Name && t2Name.includes(q)) ||
        round.includes(q) ||
        matchNum.includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Match Management</h1>
              <span className="text-sm font-semibold text-slate-500 font-mono">
                ({tournament.matches.length} Total Matches)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Record match results, review scoring history, and safely recalculate dependent brackets.
            </p>
          </div>

          {/* Quick status summary numbers */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
              {tournament.matches.filter(m => m.status === 'ready').length} Ready
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
              {tournament.matches.filter(m => m.status === 'completed').length} Completed
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {tournament.matches.filter(m => m.status === 'pending').length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams or match #..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'ready'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Ready
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Bracket Filter (if double elimination) */}
          {tournament.settings.format === 'double_elimination' && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setBracketFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  bracketFilter === 'all'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500'
                }`}
              >
                All Brackets
              </button>
              <button
                onClick={() => setBracketFilter('winners')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  bracketFilter === 'winners'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-500'
                }`}
              >
                WB
              </button>
              <button
                onClick={() => setBracketFilter('losers')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  bracketFilter === 'losers'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-500'
                }`}
              >
                LB
              </button>
              <button
                onClick={() => setBracketFilter('grand_final')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  bracketFilter === 'grand_final'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-500'
                }`}
              >
                GF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Match Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No matches match your current search and filter settings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-20">Match</th>
                  <th className="py-3 px-4">Bracket & Round</th>
                  <th className="py-3 px-4">Team 1</th>
                  <th className="py-3 px-4 text-center w-24">Score</th>
                  <th className="py-3 px-4">Team 2</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 text-right w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMatches.map(match => {
                  const t1 = match.team1Id ? teamMap.get(match.team1Id) : null;
                  const t2 = match.team2Id ? teamMap.get(match.team2Id) : null;
                  const isCompleted = match.status === 'completed';
                  const isBye = match.status === 'bye';
                  const isReady = match.status === 'ready';

                  return (
                    <tr
                      key={match.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        #{match.matchNumber}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {match.roundName}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">
                          {match.bracketType.replace('_', ' ')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {t1 ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded text-[10px] font-mono font-bold text-white flex items-center justify-center shrink-0"
                              style={{ backgroundColor: t1.badgeColor || '#3B82F6' }}
                            >
                              {t1.seed}
                            </span>
                            <span
                              className={`truncate font-medium ${
                                match.winnerId === t1.id && !isBye
                                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {t1.name}
                            </span>
                            {match.team1ByeAdvance && match.status !== 'completed' && (
                              <span className="text-[9px] font-bold px-1 py-px rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                BYE
                              </span>
                            )}
                            {!isBye && match.winnerId === t1.id && <Trophy className="w-3 h-3 text-amber-500" />}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            {match.team1Placeholder || 'TBD'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                        {match.team1Score !== null && match.team2Score !== null ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {match.team1Score} - {match.team2Score}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {t2 ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded text-[10px] font-mono font-bold text-white flex items-center justify-center shrink-0"
                              style={{ backgroundColor: t2.badgeColor || '#3B82F6' }}
                            >
                              {t2.seed}
                            </span>
                            <span
                              className={`truncate font-medium ${
                                match.winnerId === t2.id && !isBye
                                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {t2.name}
                            </span>
                            {match.team2ByeAdvance && match.status !== 'completed' && (
                              <span className="text-[9px] font-bold px-1 py-px rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                BYE
                              </span>
                            )}
                            {!isBye && match.winnerId === t2.id && <Trophy className="w-3 h-3 text-amber-500" />}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            {match.team2Placeholder || 'TBD'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isCompleted && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                        {isReady && (
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            Ready
                          </span>
                        )}
                        {isBye && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            BYE Advance
                          </span>
                        )}
                        {match.status === 'pending' && (
                          <span className="text-[11px] text-slate-400">
                            Waiting
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {(isReady || isCompleted) && !isBye ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenScore(match)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isCompleted ? 'Edit' : 'Score'}</span>
                            </button>
                            {isCompleted && (
                              <button
                                onClick={() => onResetMatch(match.id)}
                                className="p-1 text-slate-400 hover:text-amber-500 rounded-lg"
                                title="Reset match"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
