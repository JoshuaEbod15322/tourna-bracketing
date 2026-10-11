import React, { useState } from 'react';
import { X, Settings, RotateCcw, Trash2, ShieldAlert } from 'lucide-react';
import { Tournament, TournamentFormat } from '../../types/tournament';

interface TournamentSettingsModalProps {
  isOpen: boolean;
  tournament: Tournament;
  onClose: () => void;
  onSave: (updates: Partial<Tournament>) => void;
  onResetBracket: () => void;
  onDeleteTournament: () => void;
}

export const TournamentSettingsModal: React.FC<TournamentSettingsModalProps> = ({
  isOpen,
  tournament,
  onClose,
  onSave,
  onResetBracket,
  onDeleteTournament,
}) => {
  const [name, setName] = useState(tournament.name);
  const [gameOrSport, setGameOrSport] = useState(tournament.gameOrSport);
  const [description, setDescription] = useState(tournament.description || '');
  const [organizer, setOrganizer] = useState(tournament.organizer || '');
  const [format, setFormat] = useState<TournamentFormat>(tournament.settings.format);

  const hasMatchesStarted = tournament.matches.some(m => m.status === 'completed');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      gameOrSport: gameOrSport.trim(),
      description: description.trim() || undefined,
      organizer: organizer.trim() || undefined,
      settings: {
        ...tournament.settings,
        format: hasMatchesStarted ? tournament.settings.format : format,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tournament Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure parameters or reset bracket state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Game or Sport
              </label>
              <input
                type="text"
                value={gameOrSport}
                onChange={e => setGameOrSport(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organizer
              </label>
              <input
                type="text"
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Format lock check */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tournament Format
            </label>
            {hasMatchesStarted ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Format is locked because matches have already concluded. Reset the bracket to change format.</span>
              </div>
            ) : (
              <select
                value={format}
                onChange={e => setFormat(e.target.value as TournamentFormat)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
              </select>
            )}
          </div>

          {/* Danger zone actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tournament Actions</h4>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResetBracket();
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Bracket & Scores
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteTournament();
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Tournament
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
