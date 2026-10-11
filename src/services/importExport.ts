import { ApplicationData, Team, Tournament } from '../types/tournament';
import { getApplicationData, saveApplicationData } from './storage';

/**
 * Initiates browser file download for a blob or string.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Export a single tournament as JSON.
 */
export function exportTournamentJSON(tournament: Tournament): void {
  const exportPayload = {
    _exportType: 'single_tournament',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tournament,
  };
  const safeName = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadFile(JSON.stringify(exportPayload, null, 2), `${safeName}-backup.json`);
}

/**
 * Export all tournaments as a complete JSON backup.
 */
export function exportAllDataBackup(): void {
  const data = getApplicationData();
  const backupPayload = {
    ...data,
    exportedAt: new Date().toISOString(),
  };
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(JSON.stringify(backupPayload, null, 2), `apex-tournaments-full-backup-${dateStr}.json`);
}

/**
 * Export teams of a tournament as CSV.
 */
export function exportTeamsCSV(tournament: Tournament): void {
  const headers = ['Seed', 'Team Name', 'Losses', 'Team ID'];
  const rows = tournament.teams
    .sort((a, b) => a.seed - b.seed)
    .map(t => [t.seed, `"${t.name.replace(/"/g, '""')}"`, t.losses, t.id]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const safeName = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadFile(csvContent, `${safeName}-teams.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export match results of a tournament as CSV.
 */
export function exportMatchesCSV(tournament: Tournament): void {
  const headers = ['Match #', 'Bracket', 'Round', 'Team 1', 'Team 2', 'Score 1', 'Score 2', 'Winner', 'Status'];
  const teamMap = new Map(tournament.teams.map(t => [t.id, t.name]));

  const rows = tournament.matches
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map(m => {
      const t1 = m.team1Id ? teamMap.get(m.team1Id) || m.team1Id : m.team1Placeholder || 'TBD';
      const t2 = m.team2Id ? teamMap.get(m.team2Id) || m.team2Id : m.team2Placeholder || 'TBD';
      const winner = m.winnerId ? teamMap.get(m.winnerId) || m.winnerId : 'TBD';

      return [
        m.matchNumber,
        m.bracketType,
        `"${m.roundName}"`,
        `"${t1.replace(/"/g, '""')}"`,
        `"${t2.replace(/"/g, '""')}"`,
        m.team1Score !== null ? m.team1Score : '',
        m.team2Score !== null ? m.team2Score : '',
        `"${winner.replace(/"/g, '""')}"`,
        m.status,
      ];
    });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const safeName = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadFile(csvContent, `${safeName}-matches.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Validates whether raw JSON conforms to a single tournament format.
 */
export function validateSingleTournamentJSON(json: any): { isValid: boolean; tournament?: Tournament; errors: string[] } {
  const errors: string[] = [];

  let candidate = json;
  if (json && json.tournament && json._exportType === 'single_tournament') {
    candidate = json.tournament;
  }

  if (!candidate || typeof candidate !== 'object') {
    return { isValid: false, errors: ['JSON is not a valid object.'] };
  }

  if (!candidate.name || typeof candidate.name !== 'string') {
    errors.push('Missing or invalid tournament name.');
  }

  if (!Array.isArray(candidate.teams)) {
    errors.push('Teams must be an array.');
  } else {
    candidate.teams.forEach((t: any, index: number) => {
      if (!t.name || typeof t.name !== 'string') {
        errors.push(`Team at index ${index} is missing a name.`);
      }
    });
  }

  if (!candidate.settings || typeof candidate.settings !== 'object') {
    errors.push('Missing tournament settings.');
  }

  return {
    isValid: errors.length === 0,
    tournament: errors.length === 0 ? (candidate as Tournament) : undefined,
    errors,
  };
}

/**
 * Validates full application backup JSON.
 */
export function validateFullBackupJSON(json: any): { isValid: boolean; tournaments?: Tournament[]; errors: string[] } {
  const errors: string[] = [];

  if (!json || typeof json !== 'object') {
    return { isValid: false, errors: ['Invalid JSON backup payload.'] };
  }

  if (!Array.isArray(json.tournaments)) {
    errors.push('Backup payload does not contain a valid tournaments list.');
  } else {
    json.tournaments.forEach((t: any, idx: number) => {
      if (!t.id || !t.name) {
        errors.push(`Tournament #${idx + 1} is missing an ID or name.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    tournaments: errors.length === 0 ? (json.tournaments as Tournament[]) : undefined,
    errors,
  };
}

/**
 * Parses team records from CSV text.
 * Supports lines with "Seed, Team Name" or simply "Team Name".
 */
export function parseTeamsFromCSV(csvText: string): {
  teams: Array<{ name: string; seed?: number }>;
  warnings: string[];
  errors: string[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const errors: string[] = [];
  const teams: Array<{ name: string; seed?: number }> = [];

  if (lines.length === 0) {
    return { teams: [], warnings: [], errors: ['CSV file is empty.'] };
  }

  // Check if first line is a header
  let startIndex = 0;
  const firstLineLower = lines[0].toLowerCase();
  if (
    firstLineLower.includes('team') ||
    firstLineLower.includes('name') ||
    firstLineLower.includes('seed')
  ) {
    startIndex = 1;
  }

  const seenNames = new Set<string>();

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split by comma outside of quotes
    const parts = rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLine.split(',');
    const cleanParts = parts.map(p => p.trim().replace(/^"(.*)"$/, '$1'));

    if (cleanParts.length === 0 || !cleanParts[0]) continue;

    let teamName = '';
    let seed: number | undefined;

    // Check if first column is numeric seed
    const numFirst = parseInt(cleanParts[0], 10);
    if (!isNaN(numFirst) && cleanParts.length > 1) {
      seed = numFirst;
      teamName = cleanParts[1];
    } else {
      teamName = cleanParts[0];
      if (cleanParts.length > 1) {
        const numSecond = parseInt(cleanParts[1], 10);
        if (!isNaN(numSecond)) seed = numSecond;
      }
    }

    if (teamName) {
      if (seenNames.has(teamName.toLowerCase())) {
        warnings.push(`Duplicate team name detected: "${teamName}" at line ${i + 1}`);
      }
      seenNames.add(teamName.toLowerCase());
      teams.push({ name: teamName, seed });
    }
  }

  if (teams.length === 0) {
    errors.push('No valid team names could be extracted from the CSV.');
  }

  return { teams, warnings, errors };
}

/**
 * Merge imported tournaments into current storage.
 */
export function mergeTournaments(incoming: Tournament[]): { added: number; updated: number } {
  const currentData = getApplicationData();
  const existingMap = new Map(currentData.tournaments.map(t => [t.id, t]));

  let added = 0;
  let updated = 0;

  incoming.forEach(tourn => {
    if (existingMap.has(tourn.id)) {
      existingMap.set(tourn.id, tourn);
      updated++;
    } else {
      existingMap.set(tourn.id, tourn);
      added++;
    }
  });

  const mergedList = Array.from(existingMap.values());
  saveApplicationData({
    ...currentData,
    tournaments: mergedList,
    lastActiveTournamentId: incoming[0]?.id || currentData.lastActiveTournamentId,
  });

  return { added, updated };
}

/**
 * Replaces all tournaments with incoming tournaments after confirmation.
 */
export function replaceTournaments(incoming: Tournament[]): void {
  const currentData = getApplicationData();
  saveApplicationData({
    ...currentData,
    tournaments: incoming,
    lastActiveTournamentId: incoming[0]?.id,
  });
}
