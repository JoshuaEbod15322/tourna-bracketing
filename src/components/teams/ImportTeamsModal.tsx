import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { parseTeamsFromCSV } from '../../services/importExport';

interface ImportTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (teams: Array<{ name: string; seed?: number }>) => void;
  existingTeamNames: string[];
}

export const ImportTeamsModal: React.FC<ImportTeamsModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingTeamNames,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [parsedTeams, setParsedTeams] = useState<Array<{ name: string; seed?: number }>>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setCsvContent(text);
    if (!text.trim()) {
      setParsedTeams([]);
      setWarnings([]);
      setErrors([]);
      return;
    }

    const res = parseTeamsFromCSV(text);
    // Cross check against existing teams
    const crossWarnings = [...res.warnings];
    res.teams.forEach(t => {
      if (existingTeamNames.some(existing => existing.toLowerCase() === t.name.toLowerCase())) {
        crossWarnings.push(`"${t.name}" is already registered in this tournament.`);
      }
    });

    setParsedTeams(res.teams);
    setWarnings(crossWarnings);
    setErrors(res.errors);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedTeams.length === 0) return;
    onImport(parsedTeams);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Import Teams (CSV / Text)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Paste team names or upload a CSV file</p>
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                CSV Input or Team List
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                Upload CSV File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <textarea
              rows={5}
              value={csvContent}
              onChange={e => handleTextChange(e.target.value)}
              placeholder={`Seed, Team Name\n1, Vanguard Prime\n2, Solar Titans\n3, Apex Predators\n...or just one team per line`}
              className="w-full px-3.5 py-2 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errors.length > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 space-y-1">
              {errors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 space-y-1 max-h-24 overflow-y-auto">
              <div className="font-semibold flex items-center gap-1 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Warnings:</span>
              </div>
              {warnings.map((warn, i) => (
                <p key={i}>• {warn}</p>
              ))}
            </div>
          )}

          {parsedTeams.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Ready to import {parsedTeams.length} teams
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {parsedTeams.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-slate-800 text-xs border border-slate-100 dark:border-slate-700/50"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {t.seed ? `Seed #${t.seed}` : `Order #${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              disabled={parsedTeams.length === 0}
              onClick={handleConfirmImport}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm"
            >
              Import {parsedTeams.length} Teams
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
