import React, { useState } from "react";
import {
  Trophy,
  Users,
  PlayCircle,
  CheckCircle2,
  Plus,
  Search,
  Calendar,
  Shield,
  Trash2,
  Settings,
  ArrowRight,
  Download,
} from "lucide-react";
import { Tournament, TournamentStatus } from "../../types/tournament";
import { exportTournamentJSON } from "../../services/importExport";

interface DashboardViewProps {
  tournaments: Tournament[];
  onSelectTournament: (
    id: string,
    tab?: "bracket" | "teams" | "matches",
  ) => void;
  onOpenCreate: () => void;
  onOpenSettings: (tournament: Tournament) => void;
  onDeleteTournament: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tournaments,
  onSelectTournament,
  onOpenCreate,
  onOpenSettings,
  onDeleteTournament,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TournamentStatus>(
    "all",
  );

  // Aggregated KPIs
  const totalTournaments = tournaments.length;
  const totalTeams = tournaments.reduce((acc, t) => acc + t.teams.length, 0);

  let totalOngoingMatches = 0;
  let totalCompletedMatches = 0;
  tournaments.forEach((t) => {
    t.matches.forEach((m) => {
      if (m.status === "ready" || m.status === "ongoing") totalOngoingMatches++;
      if (m.status === "completed") totalCompletedMatches++;
    });
  });

  const filteredTournaments = tournaments.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.gameOrSport.toLowerCase().includes(q) ||
        (t.organizer && t.organizer.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Hero / Quick Stats Bar */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tournament Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tournament</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Tournaments
              </span>
              <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
              {totalTournaments}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Stored locally
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Registered Teams
              </span>
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
              {totalTeams}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Across all rosters
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Ready / Ongoing
              </span>
              <PlayCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
              {totalOngoingMatches}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Pending outcome
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Completed Matches
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
              {totalCompletedMatches}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Decided results
            </span>
          </div>
        </div>
      </div>

      {/* Tournaments List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments or sports..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("upcoming")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter("ongoing")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === "ongoing"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === "completed"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredTournaments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No tournaments found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {search
                ? "Try tweaking your search keywords or status filter"
                : "Create your first tournament bracket to get started."}
            </p>
            {!search && (
              <button
                onClick={onOpenCreate}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs"
              >
                Create Tournament
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map((tournament) => {
              const champion = tournament.championTeamId
                ? tournament.teams.find(
                    (t) => t.id === tournament.championTeamId,
                  )
                : null;

              return (
                <div
                  key={tournament.id}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">
                          {tournament.gameOrSport}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {tournament.name}
                        </h3>
                      </div>

                      {/* Status indicator */}
                      <span className="text-[11px] font-mono text-slate-500 capitalize">
                        {tournament.status}
                      </span>
                    </div>

                    {tournament.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {tournament.description}
                      </p>
                    )}

                    {/* Metadata strip */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono py-2 border-y border-slate-100 dark:border-slate-800/80 mb-3">
                      <span>{tournament.teams.length} Teams</span>
                      <span>·</span>
                      <span>
                        {tournament.settings.format === "double_elimination"
                          ? "Double Elim"
                          : "Single Elim"}
                      </span>
                      {tournament.tournamentDate && (
                        <>
                          <span>·</span>
                          <span>{tournament.tournamentDate}</span>
                        </>
                      )}
                    </div>

                    {/* Champion Tag if completed */}
                    {champion && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 shrink-0 text-amber-500" />
                        <span className="truncate">
                          Champion: <strong>{champion.name}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => exportTournamentJSON(tournament)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Download JSON Backup"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenSettings(tournament)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Tournament Settings"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTournament(tournament.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Tournament"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onSelectTournament(tournament.id, "teams")
                        }
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Teams
                      </button>
                      <button
                        onClick={() =>
                          onSelectTournament(tournament.id, "bracket")
                        }
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                      >
                        <span>Bracket</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
