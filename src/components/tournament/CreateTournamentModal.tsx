import React, { useEffect, useState } from "react";
import { X, Trophy, Shield, Users } from "lucide-react";
import { Tournament, TournamentFormat } from "../../types/tournament";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (tournament: Tournament) => void;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [gameOrSport, setGameOrSport] = useState("");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [tournamentDate, setTournamentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [format, setFormat] = useState<TournamentFormat>("double_elimination");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName("");
    setGameOrSport("");
    setDescription("");
    setOrganizer("");
    setTournamentDate(new Date().toISOString().split("T")[0]);
    setFormat("double_elimination");
    setErrors({});
  };

  // Always start brand new: clear stale values every time the modal opens
  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Tournament name is required.";
    if (!gameOrSport.trim())
      newErrors.gameOrSport = "Game or sport name is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const now = new Date().toISOString();
    const tournamentId = `tourn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const initialTeams: Tournament["teams"] = [];

    const newTournament: Tournament = {
      id: tournamentId,
      name: name.trim(),
      gameOrSport: gameOrSport.trim(),
      description: description.trim() || undefined,
      organizer: organizer.trim() || undefined,
      tournamentDate: tournamentDate || undefined,
      status: "upcoming",
      settings: {
        format,
        scoreType: "points",
        seedingMethod: "standard",
        minTeams: 2,
        maxTeams: 16,
      },
      teams: initialTeams,
      matches: [],
      championTeamId: null,
      runnerUpTeamId: null,
      bracketGenerated: false,
      createdAt: now,
      updatedAt: now,
    };

    onCreate(newTournament);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Create New Tournament
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure format, rules, and seeding
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tournament Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                // placeholder="e.g. Winter Valorant Open"
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                  errors.name
                    ? "border-red-500"
                    : "border-slate-300 dark:border-slate-700"
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Game or Sport *
              </label>
              <input
                type="text"
                value={gameOrSport}
                onChange={(e) => {
                  setGameOrSport(e.target.value);
                  if (errors.gameOrSport)
                    setErrors((prev) => ({ ...prev, gameOrSport: "" }));
                }}
                // placeholder="e.g. Basketball, CS2, Smash"
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                  errors.gameOrSport
                    ? "border-red-500"
                    : "border-slate-300 dark:border-slate-700"
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
              />
              {errors.gameOrSport && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.gameOrSport}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organizer Name
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                // placeholder="e.g. Regional Esports League"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tournament Date
              </label>
              <input
                type="date"
                value={tournamentDate}
                onChange={(e) => setTournamentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              // placeholder="Brief details about prize pool, rules, venue..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tournament Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("single_elimination")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  format === "single_elimination"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Single Elimination
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  1 loss and eliminated. Faster bracket run.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat("double_elimination")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  format === "double_elimination"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Trophy className="w-4 h-4 text-blue-500" />
                  Double Elimination
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Winners & Losers brackets. 2 losses to eliminate. One Grand
                  Final decides the champion.
                </p>
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-blue-900 dark:text-blue-200 block">
                Tournament Capacity: 2 to 16 Teams (16 Maximum)
              </span>
              <p className="text-blue-700 dark:text-blue-300/90 mt-0.5">
                Generate a bracket with any number of teams from 2 up to 16. For
                team counts that are not a power of two (e.g. 3, 5–7, 9–15),
                fair byes are automatically assigned to top seeds. Add teams
                after creation from the Teams tab.
              </p>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              Create Tournament
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
