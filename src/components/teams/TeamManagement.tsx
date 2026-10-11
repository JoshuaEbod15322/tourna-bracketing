import React, { useState } from 'react';
import {
  Users,
  Plus,
  Upload,
  Shuffle,
  ArrowUpDown,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Trophy,
  ShieldAlert,
} from 'lucide-react';
import { Team, Tournament } from '../../types/tournament';
import { AddTeamModal } from './AddTeamModal';
import { ImportTeamsModal } from './ImportTeamsModal';

interface TeamManagementProps {
  tournament: Tournament;
  onAddTeam: (team: { name: string; badgeColor?: string }) => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
  onDeleteTeam: (teamId: string) => void;
  onBulkAddTeams: (teams: Array<{ name: string; seed?: number }>) => void;
  onReseedTeams: (mode: 'random' | 'alphabetical' | 'reverse') => void;
  onGenerateBracket: () => void;
  onSwitchToBracket: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  tournament,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onBulkAddTeams,
  onReseedTeams,
  onGenerateBracket,
  onSwitchToBracket,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'seed' | 'name'>('seed');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSeed, setEditSeed] = useState<number>(1);

  const minRequired = 2;
  const maxCapacity = 16;
  const currentCount = tournament.teams.length;
  const meetsMinimum = currentCount >= minRequired && currentCount <= maxCapacity;
  const isAtMaxCapacity = currentCount >= maxCapacity;
  const hasMatchesStarted = tournament.matches.some(m => m.status === 'completed');

  // Duplicate names detection
  const duplicateNames = new Set<string>();
  const seen = new Set<string>();
  tournament.teams.forEach(t => {
    const lower = t.name.trim().toLowerCase();
    if (seen.has(lower)) {
      duplicateNames.add(lower);
    }
    seen.add(lower);
  });

  const filteredTeams = tournament.teams
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.seed - b.seed;
    });

  const startEditing = (team: Team) => {
    if (hasMatchesStarted) return;
    setEditingTeamId(team.id);
    setEditName(team.name);
    setEditSeed(team.seed);
  };

  const saveEditing = (teamId: string) => {
    if (!editName.trim()) return;
    onUpdateTeam(teamId, {
      name: editName.trim(),
      seed: Number(editSeed),
    });
    setEditingTeamId(null);
  };

  const cancelEditing = () => {
    setEditingTeamId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Registered Teams</h1>
              <span className="text-sm font-semibold text-slate-500 font-mono">
                ({currentCount} / {maxCapacity} Teams Max)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tournament.name} · {tournament.gameOrSport} · Format: {tournament.settings.format === 'double_elimination' ? 'Double Elimination' : 'Single Elimination'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsImportOpen(true)}
              disabled={hasMatchesStarted || isAtMaxCapacity}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-xl transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              disabled={hasMatchesStarted || isAtMaxCapacity}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
              title={isAtMaxCapacity ? 'Maximum 16 teams reached' : 'Add team'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Team</span>
            </button>

            {!tournament.bracketGenerated ? (
              <button
                onClick={onGenerateBracket}
                disabled={!meetsMinimum}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
                title={!meetsMinimum ? 'Requires at least 2 teams' : 'Generate tournament bracket'}
              >
                <Trophy className="w-4 h-4" />
                <span>Generate Bracket ({currentCount} Teams)</span>
              </button>
            ) : (
              <button
                onClick={onSwitchToBracket}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl transition-all"
              >
                <Trophy className="w-4 h-4 text-blue-500" />
                <span>View Live Bracket</span>
              </button>
            )}
          </div>
        </div>

        {/* Team Capacity Progress Banner */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-slate-700 dark:text-slate-300">
              {currentCount < minRequired ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Need at least {minRequired} teams to generate a bracket (currently {currentCount}).
                </span>
              ) : isAtMaxCapacity ? (
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Maximum capacity reached ({currentCount} / {maxCapacity} teams). Ready to generate bracket!
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Ready to generate bracket with {currentCount} teams (Supports up to 16 teams max).
                </span>
              )}
            </span>
            <span className="font-mono text-slate-500">
              {currentCount} / {maxCapacity} Maximum
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentCount < minRequired ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (currentCount / maxCapacity) * 100)}%` }}
            />
          </div>
        </div>

        {/* Warning if matches have started */}
        {hasMatchesStarted && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Matches are already ongoing. Team additions and deletions are locked to preserve bracket integrity. Reset the bracket to modify team roster.
            </span>
          </div>
        )}

        {/* Duplicate warning */}
        {duplicateNames.size > 0 && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Warning: Duplicate team names detected in the roster ({Array.from(duplicateNames).join(', ')}). Consider renaming to avoid confusion in bracket matchups.
            </span>
          </div>
        )}
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Seeding & Sort controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setSortBy('seed')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                sortBy === 'seed'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              By Seed
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                sortBy === 'name'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              By Name
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onReseedTeams('random')}
              disabled={hasMatchesStarted || currentCount === 0}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              title="Shuffle Seeds Randomly"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReseedTeams('alphabetical')}
              disabled={hasMatchesStarted || currentCount === 0}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              title="Seed Alphabetically"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Teams Grid / List */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No teams found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {searchQuery ? 'Try clearing your search query' : 'Add at least 16 teams to unlock tournament bracket generation'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs"
            >
              Add First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredTeams.map(team => {
            const isEditing = editingTeamId === team.id;
            const isDuplicate = duplicateNames.has(team.name.trim().toLowerCase());

            return (
              <div
                key={team.id}
                className={`group bg-white dark:bg-slate-900 border ${
                  isDuplicate
                    ? 'border-red-300 dark:border-red-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                } rounded-xl p-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="128"
                        value={editSeed}
                        onChange={e => setEditSeed(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => saveEditing(team.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-500 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Seed badge & Color emblem */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold font-mono shrink-0 shadow-xs"
                        style={{ backgroundColor: team.badgeColor || '#3B82F6' }}
                      >
                        {team.seed}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {team.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>Seed #{team.seed}</span>
                          {tournament.bracketGenerated && (
                            <>
                              <span>·</span>
                              <span className={team.losses >= 2 ? 'text-red-500 font-bold' : ''}>
                                {team.losses} Loss{team.losses === 1 ? '' : 'es'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!hasMatchesStarted && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(team)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                          title="Edit team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTeam(team.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Delete team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddTeamModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAddTeam}
        existingNames={tournament.teams.map(t => t.name)}
      />

      <ImportTeamsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={onBulkAddTeams}
        existingTeamNames={tournament.teams.map(t => t.name)}
      />
    </div>
  );
};
