import { ApplicationData, Tournament } from '../types/tournament';

export const STORAGE_KEY = 'tournament-bracketing-data-v1';
export const STORAGE_THEME_KEY = 'apex-bracket-theme';

const DEFAULT_DATA: ApplicationData = {
  version: '1.0.0',
  tournaments: [],
};

/**
 * Safely loads the entire application data from localStorage.
 */
export function getApplicationData(): ApplicationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Brand new install: start empty, no sample data
      const initial: ApplicationData = {
        ...DEFAULT_DATA,
        tournaments: [],
        lastActiveTournamentId: undefined,
      };
      saveApplicationData(initial);
      return initial;
    }

    const parsed: ApplicationData = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tournaments)) {
      return DEFAULT_DATA;
    }
    // Migration: Grand Final Reset was removed — strip legacy reset matches
    // and the legacy setting so old saves render a single Grand Final.
    let migrated = false;
    const tournaments = parsed.tournaments.map(t => {
      const sourceMatches = t.matches || [];
      const cleanMatches = sourceMatches.filter(
        m => String(m.bracketType) !== 'grand_final_reset' && m.id !== 'GF-RESET'
      );
      const settings = { ...(t.settings as unknown as Record<string, unknown>) };
      if ('grandFinalReset' in settings) {
        delete settings.grandFinalReset;
        migrated = true;
      }
      if (cleanMatches.length !== sourceMatches.length) {
        migrated = true;
      }
      if (!migrated) return t;
      return {
        ...t,
        settings: settings as unknown as Tournament['settings'],
        matches: cleanMatches,
      };
    });
    if (migrated) {
      const next = { ...parsed, tournaments };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore migration write failures */
      }
      return next;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to read application data from localStorage:', error);
    return DEFAULT_DATA;
  }
}

/**
 * Safely saves the entire application data to localStorage.
 */
export function saveApplicationData(data: ApplicationData): boolean {
  try {
    const serialized = JSON.stringify({
      ...data,
      exportedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, serialized);
    // Dispatch custom event for cross-tab or in-app synchronization
    window.dispatchEvent(new CustomEvent('apex-storage-update'));
    return true;
  } catch (error) {
    console.error('Failed to write application data to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Browser storage quota exceeded. Please export your tournaments and clean up old data.');
    }
    return false;
  }
}

/**
 * Retrieves all stored tournaments.
 */
export function getAllTournaments(): Tournament[] {
  return getApplicationData().tournaments;
}

/**
 * Retrieves a single tournament by its ID.
 */
export function getTournamentById(id: string): Tournament | null {
  const all = getAllTournaments();
  return all.find(t => t.id === id) || null;
}

/**
 * Creates a new tournament and saves it.
 */
export function createTournament(tournament: Tournament): Tournament {
  const data = getApplicationData();
  const exists = data.tournaments.some(t => t.id === tournament.id);
  if (exists) {
    tournament.id = `tourn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  const updated: ApplicationData = {
    ...data,
    tournaments: [tournament, ...data.tournaments],
    lastActiveTournamentId: tournament.id,
  };
  saveApplicationData(updated);
  return tournament;
}

/**
 * Updates an existing tournament.
 */
export function updateTournament(id: string, updates: Partial<Tournament>): Tournament | null {
  const data = getApplicationData();
  const index = data.tournaments.findIndex(t => t.id === id);
  if (index === -1) return null;

  const current = data.tournaments[index];
  const updatedTournament: Tournament = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = [...data.tournaments];
  updatedList[index] = updatedTournament;

  saveApplicationData({
    ...data,
    tournaments: updatedList,
  });

  return updatedTournament;
}

/**
 * Deletes a tournament by ID.
 */
export function deleteTournament(id: string): boolean {
  const data = getApplicationData();
  const filtered = data.tournaments.filter(t => t.id !== id);
  if (filtered.length === data.tournaments.length) return false;

  const nextActive = filtered.length > 0 ? filtered[0].id : undefined;

  saveApplicationData({
    ...data,
    tournaments: filtered,
    lastActiveTournamentId: nextActive,
  });
  return true;
}

/**
 * Sets the active tournament ID.
 */
export function setLastActiveTournamentId(id: string): void {
  const data = getApplicationData();
  saveApplicationData({
    ...data,
    lastActiveTournamentId: id,
  });
}

/**
 * Clears all data and restores to default state.
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('apex-storage-update'));
}

/**
 * Theme is locked to dark (toggle removed).
 */
export function saveTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(STORAGE_THEME_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
