import React, { useEffect, useState } from 'react';
import { useTournaments } from './hooks/useTournaments';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Toast } from './components/layout/Toast';
import { ConfirmModal } from './components/layout/ConfirmModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { SingleEliminationBracket } from './components/bracket/SingleEliminationBracket';
import { DoubleEliminationBracket } from './components/bracket/DoubleEliminationBracket';
import { TeamManagement } from './components/teams/TeamManagement';
import { MatchList } from './components/matches/MatchList';
import { ScoreModal } from './components/matches/ScoreModal';
import { CreateTournamentModal } from './components/tournament/CreateTournamentModal';
import { TournamentSettingsModal } from './components/tournament/TournamentSettingsModal';
import { TournamentHeader } from './components/tournament/TournamentHeader';
import { DataManagementView } from './components/data-management/DataManagementView';
import { Match, Tournament } from './types/tournament';
import { Trophy, Users, Plus } from 'lucide-react';

export default function App() {
  const {
    tournaments,
    activeTournament,
    activeTournamentId,
    setActiveTournamentId,
    toasts,
    addToast,
    removeToast,
    createTournament,
    updateTournament,
    deleteTournament,
    generateBracket,
    recordScore,
    resetMatch,
    resetTournamentBracket,
    addTeam,
    updateTeam,
    deleteTeam,
    bulkAddTeams,
    reseedTeams,
  } = useTournaments();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTournament, setSettingsTournament] = useState<Tournament | null>(null);
  const [scoreModalMatch, setScoreModalMatch] = useState<Match | null>(null);

  // Deletion confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Regenerate-bracket confirm (only when a bracket with results already exists)
  const [regenerateConfirmId, setRegenerateConfirmId] = useState<string | null>(null);

  const handleGenerateBracket = (id: string) => {
    const target = tournaments.find(t => t.id === id);
    if (target?.bracketGenerated) {
      setRegenerateConfirmId(id);
      return;
    }
    generateBracket(id);
  };

  const handleConfirmRegenerate = () => {
    if (regenerateConfirmId) {
      generateBracket(regenerateConfirmId);
      setRegenerateConfirmId(null);
    }
  };

  const handleSelectTournament = (id: string, tab: NavTab = 'bracket') => {
    setActiveTournamentId(id);
    setCurrentTab(tab);
  };

  const handleOpenSettings = (tournament: Tournament) => {
    setSettingsTournament(tournament);
    setIsSettingsModalOpen(true);
  };

  const handlePromptDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteTournament(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const currentTourn = activeTournament || null;

  // Self-heal: if the active id is stale (e.g. after an import) but
  // tournaments exist, select the first one instead of rendering nothing.
  // The bracket therefore always belongs to the explicitly selected tournament.
  useEffect(() => {
    if (!activeTournament && tournaments.length > 0) {
      setActiveTournamentId(tournaments[0].id);
    }
  }, [activeTournament, tournaments, setActiveTournamentId]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* Sidebar navigation (collapsible desktop + hamburger drawer on mobile) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        tournamentName={currentTab !== 'dashboard' && currentTab !== 'data' ? currentTourn?.name : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <DashboardView
            tournaments={tournaments}
            onSelectTournament={handleSelectTournament}
            onOpenCreate={() => setIsCreateModalOpen(true)}
            onOpenSettings={handleOpenSettings}
            onDeleteTournament={handlePromptDelete}
          />
        )}

        {/* BRACKET TAB */}
        {currentTab === 'bracket' && (
          <div>
            {!currentTourn ? (
              <EmptyTournamentState onOpenCreate={() => setIsCreateModalOpen(true)} />
            ) : (
              <div>
                <TournamentHeader
                  currentTournament={currentTourn}
                  allTournaments={tournaments}
                  onSelectTournament={setActiveTournamentId}
                  onOpenSettings={() => handleOpenSettings(currentTourn)}
                  onGenerateBracket={() => handleGenerateBracket(currentTourn.id)}
                />

                {!currentTourn.bracketGenerated ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
                    <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Bracket Not Generated Yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      This tournament supports from 2 up to 16 teams maximum. Register at least 2 teams to generate the elimination bracket.
                      Currently registered: {currentTourn.teams.length} teams.
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <button
                        onClick={() => setCurrentTab('teams')}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        Manage Teams & Seeds
                      </button>
                      {currentTourn.teams.length >= 2 && currentTourn.teams.length <= 16 && (
                        <button
                          onClick={() => handleGenerateBracket(currentTourn.id)}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors"
                        >
                          Generate Bracket Now ({currentTourn.teams.length} Teams)
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-2 sm:px-4 pb-4">
                    {currentTourn.settings.format === 'double_elimination' ? (
                      <DoubleEliminationBracket
                        tournament={currentTourn}
                        onOpenScore={setScoreModalMatch}
                        onResetMatch={mId => resetMatch(currentTourn.id, mId)}
                      />
                    ) : (
                      <SingleEliminationBracket
                        tournament={currentTourn}
                        onOpenScore={setScoreModalMatch}
                        onResetMatch={mId => resetMatch(currentTourn.id, mId)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TEAMS TAB */}
        {currentTab === 'teams' && (
          <div>
            {!currentTourn ? (
              <EmptyTournamentState onOpenCreate={() => setIsCreateModalOpen(true)} />
            ) : (
              <div>
                <TournamentHeader
                  currentTournament={currentTourn}
                  allTournaments={tournaments}
                  onSelectTournament={setActiveTournamentId}
                  onOpenSettings={() => handleOpenSettings(currentTourn)}
                  onGenerateBracket={() => handleGenerateBracket(currentTourn.id)}
                />
                <TeamManagement
                  tournament={currentTourn}
                  onAddTeam={team => addTeam(currentTourn.id, team)}
                  onUpdateTeam={(tId, updates) => updateTeam(currentTourn.id, tId, updates)}
                  onDeleteTeam={tId => deleteTeam(currentTourn.id, tId)}
                  onBulkAddTeams={teams => bulkAddTeams(currentTourn.id, teams)}
                  onReseedTeams={mode => reseedTeams(currentTourn.id, mode)}
                  onGenerateBracket={() => handleGenerateBracket(currentTourn.id)}
                  onSwitchToBracket={() => setCurrentTab('bracket')}
                />
              </div>
            )}
          </div>
        )}

        {/* MATCHES TAB */}
        {currentTab === 'matches' && (
          <div>
            {!currentTourn ? (
              <EmptyTournamentState onOpenCreate={() => setIsCreateModalOpen(true)} />
            ) : (
              <div>
                <TournamentHeader
                  currentTournament={currentTourn}
                  allTournaments={tournaments}
                  onSelectTournament={setActiveTournamentId}
                  onOpenSettings={() => handleOpenSettings(currentTourn)}
                  onGenerateBracket={() => handleGenerateBracket(currentTourn.id)}
                />

                {!currentTourn.bracketGenerated ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
                    <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      No Matches Generated
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Register teams and generate the bracket to populate match schedule.
                    </p>
                    <button
                      onClick={() => setCurrentTab('teams')}
                      className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs"
                    >
                      View Team Roster
                    </button>
                  </div>
                ) : (
                  <MatchList
                    tournament={currentTourn}
                    onOpenScore={setScoreModalMatch}
                    onResetMatch={mId => resetMatch(currentTourn.id, mId)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* BACKUP & DATA TAB */}
        {currentTab === 'data' && (
          <DataManagementView
            tournaments={tournaments}
            activeTournament={currentTourn}
            onRefreshData={() => {
              // Trigger reload
              window.dispatchEvent(new CustomEvent('apex-storage-update'));
            }}
            onToast={addToast}
          />
        )}
      </main>

      {/* Floating Toast Notification Stack */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Score Recording Modal */}
      {scoreModalMatch && currentTourn && (
        <ScoreModal
          isOpen={Boolean(scoreModalMatch)}
          match={scoreModalMatch}
          tournament={currentTourn}
          onClose={() => setScoreModalMatch(null)}
          onSaveScore={(mId, winId, s1, s2) => {
            recordScore(currentTourn.id, mId, winId, s1, s2);
          }}
          onResetMatch={mId => {
            resetMatch(currentTourn.id, mId);
          }}
        />
      )}

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={newTourn => {
          // Brand-new tournament: clear any stale modal/selection state,
          // then land on Teams so the user registers teams before generating.
          setScoreModalMatch(null);
          setSettingsTournament(null);
          setIsSettingsModalOpen(false);
          setDeleteConfirmId(null);
          setRegenerateConfirmId(null);
          createTournament(newTourn);
          setCurrentTab('teams');
        }}
      />

      {/* Tournament Settings Modal */}
      {settingsTournament && (
        <TournamentSettingsModal
          isOpen={isSettingsModalOpen}
          tournament={settingsTournament}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={updates => updateTournament(settingsTournament.id, updates)}
          onResetBracket={() => resetTournamentBracket(settingsTournament.id)}
          onDeleteTournament={() => {
            handlePromptDelete(settingsTournament.id);
          }}
        />
      )}

      {/* Confirm Regenerate Modal */}
      <ConfirmModal
        isOpen={Boolean(regenerateConfirmId)}
        title="Regenerate Bracket?"
        message="This tournament already has a generated bracket. Regenerating will discard all match scores and bracket progression and start fresh from the current team list."
        confirmLabel="Yes, Regenerate"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmRegenerate}
        onCancel={() => setRegenerateConfirmId(null)}
      />

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        title="Delete Tournament?"
        message="Are you sure you want to delete this tournament? All teams, match scores, and bracket progressions will be permanently removed from your browser storage."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

function EmptyTournamentState({ onOpenCreate }: { onOpenCreate: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-xs">
      <Trophy className="w-12 h-12 text-blue-500 mx-auto mb-3" />
      <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Tournaments</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
        Get started by creating your first tournament or importing a tournament JSON backup.
      </p>
      <button
        onClick={onOpenCreate}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs"
      >
        <Plus className="w-4 h-4" />
        <span>Create Tournament</span>
      </button>
    </div>
  );
}
