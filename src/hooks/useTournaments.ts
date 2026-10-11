import { useEffect, useState } from 'react';
import {
  generateTournamentBracket,
  recordMatchResult,
  resetMatchResult,
} from '../services/bracketEngine';
import {
  createTournament,
  deleteTournament,
  getAllTournaments,
  getApplicationData,
  saveTheme,
  setLastActiveTournamentId,
  updateTournament,
} from '../services/storage';
import { Team, ToastMessage, Tournament } from '../types/tournament';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => getAllTournaments());
  const [activeTournamentId, setActiveTournamentIdState] = useState<string | null>(() => {
    const data = getApplicationData();
    return data.lastActiveTournamentId || (data.tournaments[0]?.id ?? null);
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Lock to dark theme (toggle removed)
  useEffect(() => {
    saveTheme('dark');
  }, []);

  // Sync with storage custom events
  useEffect(() => {
    const handleStorageUpdate = () => {
      const data = getApplicationData();
      setTournaments(data.tournaments);
      if (data.lastActiveTournamentId) {
        setActiveTournamentIdState(data.lastActiveTournamentId);
      } else if (data.tournaments.length > 0) {
        setActiveTournamentIdState(data.tournaments[0].id);
      } else {
        setActiveTournamentIdState(null);
      }
    };

    window.addEventListener('apex-storage-update', handleStorageUpdate);
    return () => window.removeEventListener('apex-storage-update', handleStorageUpdate);
  }, []);

  const addToast = (title: string, message?: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const setActiveTournamentId = (id: string) => {
    setActiveTournamentIdState(id);
    setLastActiveTournamentId(id);
  };

  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || null;

  // Actions
  const handleCreateTournament = (newTourn: Tournament) => {
    createTournament(newTourn);
    setActiveTournamentId(newTourn.id);
    addToast('Tournament Created', `"${newTourn.name}" was successfully registered.`);
  };

  const handleUpdateTournament = (id: string, updates: Partial<Tournament>) => {
    const updated = updateTournament(id, updates);
    if (updated) {
      addToast('Changes Saved', 'Tournament details updated successfully.');
    }
  };

  const handleDeleteTournament = (id: string) => {
    const target = tournaments.find(t => t.id === id);
    const success = deleteTournament(id);
    if (success) {
      addToast('Tournament Deleted', `"${target?.name || 'Tournament'}" removed from local storage.`, 'info');
    }
  };

  const handleGenerateBracket = (tournamentId: string) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    try {
      const withBracket = generateTournamentBracket(tourn);
      updateTournament(tourn.id, withBracket);
      addToast('Bracket Generated', `Bracket created with ${withBracket.matches.length} matches.`);
    } catch (err: any) {
      addToast('Generation Error', err.message || 'Unable to generate bracket.', 'error');
    }
  };

  const handleRecordScore = (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    s1: number | null,
    s2: number | null
  ) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    try {
      const updated = recordMatchResult(tourn, matchId, winnerId, s1, s2);
      updateTournament(tourn.id, updated);
      addToast('Match Recorded', 'Result saved and downstream brackets updated.');
    } catch (err: any) {
      addToast('Score Error', err.message || 'Failed to record match score.', 'error');
    }
  };

  const handleResetMatch = (tournamentId: string, matchId: string) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    try {
      const updated = resetMatchResult(tourn, matchId);
      updateTournament(tourn.id, updated);
      addToast('Match Reset', 'Match was reset to pending and dependent results cleared.', 'warning');
    } catch (err: any) {
      addToast('Reset Error', err.message || 'Failed to reset match.', 'error');
    }
  };

  const handleResetTournamentBracket = (tournamentId: string) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    const resetTourn: Tournament = {
      ...tourn,
      matches: [],
      bracketGenerated: false,
      status: 'upcoming',
      championTeamId: null,
      runnerUpTeamId: null,
      teams: tourn.teams.map(t => ({ ...t, losses: 0 })),
    };

    updateTournament(tourn.id, resetTourn);
    addToast('Bracket Reset', 'All match results and generated brackets have been cleared.', 'info');
  };

  // Team management actions
  const handleAddTeam = (tournamentId: string, teamData: { name: string; badgeColor?: string }) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: teamData.name.trim(),
      seed: tourn.teams.length + 1,
      createdAt: new Date().toISOString(),
      losses: 0,
      badgeColor: teamData.badgeColor || '#3B82F6',
    };

    const updatedTeams = [...tourn.teams, newTeam];
    updateTournament(tourn.id, { teams: updatedTeams });
    addToast('Team Added', `"${newTeam.name}" assigned Seed #${newTeam.seed}.`);
  };

  const handleUpdateTeam = (tournamentId: string, teamId: string, updates: Partial<Team>) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    const updatedTeams = tourn.teams.map(t => (t.id === teamId ? { ...t, ...updates } : t));
    updateTournament(tourn.id, { teams: updatedTeams });
    addToast('Team Updated', 'Team details updated successfully.');
  };

  const handleDeleteTeam = (tournamentId: string, teamId: string) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    const filtered = tourn.teams.filter(t => t.id !== teamId);
    // Re-assign seeds sequentially
    const reseeded = filtered.map((t, idx) => ({ ...t, seed: idx + 1 }));
    updateTournament(tourn.id, { teams: reseeded });
    addToast('Team Removed', 'Team was deleted and remaining seeds adjusted.', 'info');
  };

  const handleBulkAddTeams = (tournamentId: string, newTeams: Array<{ name: string; seed?: number }>) => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    let currentCount = tourn.teams.length;
    const created: Team[] = newTeams.map((item, idx) => ({
      id: `team-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name.trim(),
      seed: item.seed || currentCount + idx + 1,
      createdAt: new Date().toISOString(),
      losses: 0,
      badgeColor: '#3B82F6',
    }));

    const combined = [...tourn.teams, ...created];
    // Normalize seeds
    combined.sort((a, b) => a.seed - b.seed);
    const normalized = combined.map((t, i) => ({ ...t, seed: i + 1 }));

    updateTournament(tourn.id, { teams: normalized });
    addToast('Teams Imported', `Successfully added ${created.length} teams.`);
  };

  const handleReseedTeams = (tournamentId: string, mode: 'random' | 'alphabetical' | 'reverse') => {
    const tourn = tournaments.find(t => t.id === tournamentId);
    if (!tourn) return;

    let sorted = [...tourn.teams];
    if (mode === 'random') {
      sorted.sort(() => Math.random() - 0.5);
    } else if (mode === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (mode === 'reverse') {
      sorted.sort((a, b) => b.seed - a.seed);
    }

    const reseeded = sorted.map((t, i) => ({ ...t, seed: i + 1 }));
    updateTournament(tourn.id, { teams: reseeded });
    addToast('Seeds Reordered', `Teams reseeded using ${mode} strategy.`);
  };

  return {
    tournaments,
    activeTournament,
    activeTournamentId,
    setActiveTournamentId,
    toasts,
    addToast,
    removeToast,
    createTournament: handleCreateTournament,
    updateTournament: handleUpdateTournament,
    deleteTournament: handleDeleteTournament,
    generateBracket: handleGenerateBracket,
    recordScore: handleRecordScore,
    resetMatch: handleResetMatch,
    resetTournamentBracket: handleResetTournamentBracket,
    addTeam: handleAddTeam,
    updateTeam: handleUpdateTeam,
    deleteTeam: handleDeleteTeam,
    bulkAddTeams: handleBulkAddTeams,
    reseedTeams: handleReseedTeams,
  };
}
