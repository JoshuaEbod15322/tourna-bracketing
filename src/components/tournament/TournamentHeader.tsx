import React from 'react';
import {
  Trophy,
  ChevronDown,
  Settings,
  Download,
  Share2,
  RotateCcw,
  Shield,
  Users,
} from 'lucide-react';
import { Tournament } from '../../types/tournament';
import { exportTournamentJSON } from '../../services/importExport';

interface TournamentHeaderProps {
  currentTournament: Tournament;
  allTournaments: Tournament[];
  onSelectTournament: (id: string) => void;
  onOpenSettings: () => void;
  onGenerateBracket: () => void;
}

export const TournamentHeader: React.FC<TournamentHeaderProps> = ({
  currentTournament,
  allTournaments,
  onSelectTournament,
  onOpenSettings,
  onGenerateBracket,
}) => {
  const minRequired = 2;
  const maxCapacity = 16;
  const teamCount = currentTournament.teams.length;
  const isReadyToGenerate = teamCount >= minRequired && teamCount <= maxCapacity;
  const isDoubleElim = currentTournament.settings.format === 'double_elimination';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Tournament selector & Details */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Trophy className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown tournament switcher */}
              {allTournaments.length > 1 ? (
                <div className="relative inline-block">
                  <select
                    value={currentTournament.id}
                    onChange={e => onSelectTournament(e.target.value)}
                    className="appearance-none font-bold text-lg text-slate-900 dark:text-white bg-transparent pr-7 pl-1 py-0.5 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    {allTournaments.map(t => (
                      <option key={t.id} value={t.id} className="dark:bg-slate-900">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentTournament.name}
                </h1>
              )}

              {/* Status text */}
              <span className="text-xs font-mono text-slate-500 capitalize">
                · {currentTournament.status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span>{currentTournament.gameOrSport}</span>
              <span>·</span>
              <span>{isDoubleElim ? 'Double Elimination' : 'Single Elimination'}</span>
              <span>·</span>
              <span>{teamCount} Teams Registered</span>
              {currentTournament.bracketGenerated && (
                <>
                  <span>·</span>
                  <span>{currentTournament.matches.length} Matches</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
          {!currentTournament.bracketGenerated && (
            <button
              onClick={onGenerateBracket}
              disabled={!isReadyToGenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Generate Bracket ({teamCount} Teams)</span>
            </button>
          )}
          {currentTournament.bracketGenerated && (
            <button
              onClick={onGenerateBracket}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Rebuild the bracket from the current team list (scores will be lost)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          )}

          <button
            onClick={() => exportTournamentJSON(currentTournament)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Download JSON Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Backup</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Tournament Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
