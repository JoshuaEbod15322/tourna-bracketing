import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { Match, Team, Tournament } from '../../types/tournament';

interface ScoreModalProps {
  isOpen: boolean;
  match: Match | null;
  tournament: Tournament;
  onClose: () => void;
  onSaveScore: (matchId: string, winnerId: string, s1: number | null, s2: number | null) => void;
  onResetMatch: (matchId: string) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  match,
  tournament,
  onClose,
  onSaveScore,
  onResetMatch,
}) => {
  if (!isOpen || !match) return null;

  const team1 = tournament.teams.find(t => t.id === match.team1Id);
  const team2 = tournament.teams.find(t => t.id === match.team2Id);

  const [team1Score, setTeam1Score] = useState<string>(
    match.team1Score !== null ? String(match.team1Score) : ''
  );
  const [team2Score, setTeam2Score] = useState<string>(
    match.team2Score !== null ? String(match.team2Score) : ''
  );
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(match.winnerId);
  const [error, setError] = useState<string | null>(null);
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);

  // Is editing an already completed match?
  const isEditingCompleted = match.status === 'completed';

  // Automatically update winner selection when numerical scores change
  const handleScore1Change = (val: string) => {
    setTeam1Score(val);
    setError(null);
    const n1 = val === '' ? null : Number(val);
    const n2 = team2Score === '' ? null : Number(team2Score);

    if (n1 !== null && n2 !== null && team1 && team2) {
      if (n1 > n2) {
        setSelectedWinnerId(team1.id);
      } else if (n2 > n1) {
        setSelectedWinnerId(team2.id);
      }
    }
  };

  const handleScore2Change = (val: string) => {
    setTeam2Score(val);
    setError(null);
    const n1 = team1Score === '' ? null : Number(team1Score);
    const n2 = val === '' ? null : Number(val);

    if (n1 !== null && n2 !== null && team1 && team2) {
      if (n1 > n2) {
        setSelectedWinnerId(team1.id);
      } else if (n2 > n1) {
        setSelectedWinnerId(team2.id);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1 || !team2) {
      setError('Both teams must be present to record a match result.');
      return;
    }

    if (!selectedWinnerId) {
      setError('Please select a winner for this match.');
      return;
    }

    const s1 = team1Score === '' ? null : Number(team1Score);
    const s2 = team2Score === '' ? null : Number(team2Score);

    if (s1 !== null && s2 !== null) {
      if (s1 === s2) {
        setError('Ties are not allowed in elimination brackets. One team must win.');
        return;
      }
      if ((s1 > s2 && selectedWinnerId !== team1.id) || (s2 > s1 && selectedWinnerId !== team2.id)) {
        setError('Selected winner does not match the entered scores. Please adjust.');
        return;
      }
    }

    // If changing an already-completed match's winner, warn user about downstream reset
    if (isEditingCompleted && match.winnerId !== selectedWinnerId && !showOverrideWarning) {
      setShowOverrideWarning(true);
      return;
    }

    onSaveScore(match.id, selectedWinnerId, s1, s2);
    onClose();
  };

  const handleReset = () => {
    onResetMatch(match.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                Match #{match.matchNumber}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {match.roundName}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Record Match Result
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showOverrideWarning && (
          <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 space-y-2">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Winner is being modified!</span>
            </div>
            <p>
              Changing the winner of this match will reset dependent downstream matches that relied on the previous winner. Click Confirm below to proceed with recalculation.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-3">
            {/* Team 1 Score Row */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                selectedWinnerId === team1?.id
                  ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded text-xs font-mono font-bold text-white flex items-center justify-center shrink-0"
                    style={{ backgroundColor: team1?.badgeColor || '#3B82F6' }}
                  >
                    {team1?.seed}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {team1?.name || 'Team 1'}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Seed #{team1?.seed}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min="0"
                    value={team1Score}
                    onChange={e => handleScore1Change(e.target.value)}
                    placeholder="0"
                    className="w-16 px-2.5 py-1.5 text-center font-mono font-bold text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => team1 && setSelectedWinnerId(team1.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      selectedWinnerId === team1?.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Win</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Team 2 Score Row */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                selectedWinnerId === team2?.id
                  ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded text-xs font-mono font-bold text-white flex items-center justify-center shrink-0"
                    style={{ backgroundColor: team2?.badgeColor || '#3B82F6' }}
                  >
                    {team2?.seed}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {team2?.name || 'Team 2'}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Seed #{team2?.seed}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min="0"
                    value={team2Score}
                    onChange={e => handleScore2Change(e.target.value)}
                    placeholder="0"
                    className="w-16 px-2.5 py-1.5 text-center font-mono font-bold text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => team2 && setSelectedWinnerId(team2.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      selectedWinnerId === team2?.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Win</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            {isEditingCompleted ? (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Match</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{showOverrideWarning ? 'Confirm & Recalculate' : 'Save Result'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
