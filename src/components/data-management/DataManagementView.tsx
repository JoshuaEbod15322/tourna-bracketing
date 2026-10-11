import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Database,
  FileText,
  AlertTriangle,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { Tournament } from '../../types/tournament';
import {
  exportAllDataBackup,
  exportMatchesCSV,
  exportTeamsCSV,
  exportTournamentJSON,
  mergeTournaments,
  replaceTournaments,
  validateFullBackupJSON,
  validateSingleTournamentJSON,
} from '../../services/importExport';
import { clearAllData } from '../../services/storage';
import { ImportPreviewModal } from './ImportPreviewModal';
import { ConfirmModal } from '../layout/ConfirmModal';

interface DataManagementViewProps {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  onRefreshData: () => void;
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  tournaments,
  activeTournament,
  onRefreshData,
  onToast,
}) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    activeTournament?.id || tournaments[0]?.id || ''
  );
  const [importTournaments, setImportTournaments] = useState<Tournament[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);

  const singleImportInputRef = useRef<HTMLInputElement>(null);
  const backupImportInputRef = useRef<HTMLInputElement>(null);

  const currentSelected = tournaments.find(t => t.id === selectedTournamentId) || activeTournament;

  // Handle single tournament JSON import
  const handleSingleJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validated = validateSingleTournamentJSON(parsed);
        if (!validated.isValid || !validated.tournament) {
          onToast('Invalid Tournament File', validated.errors.join('; '), 'error');
          return;
        }

        setImportTournaments([validated.tournament]);
        setIsPreviewOpen(true);
      } catch (err: any) {
        onToast('JSON Parse Error', 'Could not parse JSON file. Please check file formatting.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle full backup JSON import
  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Could be full backup or single tournament
        if (parsed.tournaments && Array.isArray(parsed.tournaments)) {
          const validated = validateFullBackupJSON(parsed);
          if (!validated.isValid || !validated.tournaments) {
            onToast('Invalid Backup File', validated.errors.join('; '), 'error');
            return;
          }
          setImportTournaments(validated.tournaments);
          setIsPreviewOpen(true);
        } else {
          // Fallback to single tournament validation
          const single = validateSingleTournamentJSON(parsed);
          if (single.isValid && single.tournament) {
            setImportTournaments([single.tournament]);
            setIsPreviewOpen(true);
          } else {
            onToast('Unsupported Backup Format', 'Payload must contain a valid tournament or tournaments list.', 'error');
          }
        }
      } catch (err: any) {
        onToast('File Read Error', 'Unable to parse file. Make sure it is valid JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = (mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      replaceTournaments(importTournaments);
      onToast('Data Restored', `Restored ${importTournaments.length} tournament(s) from backup.`);
    } else {
      const { added, updated } = mergeTournaments(importTournaments);
      onToast('Import Merged', `Added ${added} new, updated ${updated} existing tournament(s).`);
    }
    onRefreshData();
  };

  const handleWipeAll = () => {
    clearAllData();
    onToast('Storage Reset', 'All local tournament data has been cleared.', 'info');
    onRefreshData();
    setIsWipeConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Data Management & Backup</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Export and restore your private tournament records locally without external cloud dependencies.
            </p>
          </div>

          <button
            onClick={exportAllDataBackup}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export All Data Backup</span>
          </button>
        </div>

        {/* Browser storage warning banner */}
        <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Browser Local Storage Notice</span>
            <p className="leading-relaxed">
              All tournaments are stored securely inside your browser&apos;s localStorage on this device.
              Clearing browser cache or site data will erase these tournaments unless you export a JSON backup beforehand.
              We recommend saving a backup regularly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: INDIVIDUAL TOURNAMENT EXPORT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Export Single Tournament
                </h3>
                <p className="text-xs text-slate-500">Download selected tournament data and spreadsheets</p>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No tournaments available to export.</p>
            ) : (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Tournament
                  </label>
                  <select
                    value={selectedTournamentId}
                    onChange={e => setSelectedTournamentId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.teams.length} Teams · {t.matches.length} Matches)
                      </option>
                    ))}
                  </select>
                </div>

                {currentSelected && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {currentSelected.name}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      Format: {currentSelected.settings.format === 'double_elimination' ? 'Double Elimination' : 'Single Elimination'} · {currentSelected.teams.length} Teams · {currentSelected.matches.length} Matches
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            <button
              disabled={!currentSelected}
              onClick={() => currentSelected && exportTournamentJSON(currentSelected)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Tournament (JSON)</span>
            </button>

            <button
              disabled={!currentSelected}
              onClick={() => currentSelected && exportTeamsCSV(currentSelected)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Teams (CSV)</span>
            </button>

            <button
              disabled={!currentSelected || currentSelected.matches.length === 0}
              onClick={() => currentSelected && exportMatchesCSV(currentSelected)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Matches (CSV)</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: IMPORT & RESTORE BACKUP */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Import & Restore Backups
                </h3>
                <p className="text-xs text-slate-500">Restore single tournaments or complete backups</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Upload any previously exported JSON file. You will preview all incoming tournaments and choose whether to <strong>Merge</strong> them with existing records or <strong>Replace</strong> your local database.
            </p>

            <div className="mt-4 space-y-2.5">
              <input
                ref={singleImportInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleSingleJSONUpload}
              />
              <input
                ref={backupImportInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleBackupUpload}
              />

              <button
                onClick={() => singleImportInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Import Tournament
                  </div>
                  <div className="text-[11px] text-slate-500">Upload a single tournament JSON file</div>
                </div>
                <Upload className="w-4 h-4 text-blue-500" />
              </button>

              <button
                onClick={() => backupImportInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Restore Backup
                  </div>
                  <div className="text-[11px] text-slate-500">Restore full multiple-tournament archive</div>
                </div>
                <Database className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>

          {/* Reset / Wipe Danger Option */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Clear storage state:</span>
            <button
              onClick={() => setIsWipeConfirmOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            >
              Clear All Local Tournaments
            </button>
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        incomingTournaments={importTournaments}
        existingTournaments={tournaments}
        onConfirm={handleConfirmImport}
      />

      {/* Clear all confirm */}
      <ConfirmModal
        isOpen={isWipeConfirmOpen}
        title="Clear All Tournament Data?"
        message="This action will delete all locally stored tournaments from this browser. This cannot be undone unless you have downloaded a backup file."
        confirmLabel="Yes, Clear All Data"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleWipeAll}
        onCancel={() => setIsWipeConfirmOpen(false)}
      />
    </div>
  );
};
