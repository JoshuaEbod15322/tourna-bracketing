import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, FileText, Database } from 'lucide-react';
import { Tournament } from '../../types/tournament';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomingTournaments: Tournament[];
  existingTournaments: Tournament[];
  onConfirm: (mode: 'merge' | 'replace') => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  incomingTournaments,
  existingTournaments,
  onConfirm,
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  if (!isOpen || incomingTournaments.length === 0) return null;

  const existingIds = new Set(existingTournaments.map(t => t.id));
  const conflictingTournaments = incomingTournaments.filter(t => existingIds.has(t.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirm Tournament Import
              </h3>
              <p className="text-xs text-slate-500">
                Preview incoming data before saving to localStorage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-200">
            Found <strong>{incomingTournaments.length}</strong> tournament(s) ready to import.
          </div>

          {/* List of incoming tournaments */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30 max-h-48 overflow-y-auto space-y-2">
            {incomingTournaments.map(t => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                    <span>{t.gameOrSport}</span>
                    <span>·</span>
                    <span>{t.teams.length} Teams</span>
                    <span>·</span>
                    <span>{t.matches.length} Matches</span>
                  </div>
                </div>

                {existingIds.has(t.id) && (
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                    Existing ID
                  </span>
                )}
              </div>
            ))}
          </div>

          {conflictingTournaments.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Conflicting IDs Detected</span>
                {conflictingTournaments.length} incoming tournament(s) share an ID with existing local tournaments. If you choose Merge, existing versions will be updated.
              </div>
            </div>
          )}

          {/* Merge vs Replace selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Import Strategy:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'merge'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  Merge With Existing
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Adds imported tournaments alongside your current local tournaments.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'replace'
                    ? 'border-red-600 bg-red-50/50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Replace All Data
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Wipes current local tournaments and restores from this backup file.
                </p>
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(importMode);
                onClose();
              }}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs ${
                importMode === 'replace'
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {importMode === 'replace' ? 'Replace & Restore Data' : 'Merge Tournaments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
