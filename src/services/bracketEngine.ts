import { Match, MatchStatus, Team, Tournament } from "../types/tournament";
import {
  getNextPowerOfTwo,
  getRoundName,
  getStandardSeedPairs,
} from "./seedGenerator";

/**
 * Validates whether tournament is eligible to generate bracket.
 * Requires at least 2 teams, up to 16 teams maximum.
 */
export function canGenerateBracket(tournament: Tournament): {
  canGenerate: boolean;
  reason?: string;
} {
  if (tournament.teams.length < 2) {
    return {
      canGenerate: false,
      reason: `Tournament requires at least 2 teams to generate a bracket. Currently registered: ${tournament.teams.length}.`,
    };
  }
  if (tournament.teams.length > 16) {
    return {
      canGenerate: false,
      reason: `Tournament supports up to 16 teams maximum. Currently registered: ${tournament.teams.length}.`,
    };
  }
  return { canGenerate: true };
}

/**
 * Generates matches for Single Elimination format.
 */
export function generateSingleElimination(tournament: Tournament): Tournament {
  const teams = [...tournament.teams];
  const N = teams.length;
  const S = getNextPowerOfTwo(N, 2);
  const totalRounds = Math.log2(S);

  // Map seed to team
  const seedToTeam: Record<number, Team> = {};
  teams.forEach((t) => {
    seedToTeam[t.seed] = t;
  });

  const matches: Match[] = [];
  let matchCounter = 1;

  // Round 1 seed pairings
  const seedPairs = getStandardSeedPairs(S);
  const round1Matches: Match[] = [];

  for (let i = 0; i < seedPairs.length; i++) {
    const [s1, s2] = seedPairs[i];
    const team1 = seedToTeam[s1] || null;
    const team2 = seedToTeam[s2] || null;

    const matchId = `SE-R1-M${i + 1}`;
    const roundName = getRoundName("single", 1, totalRounds);

    let status: MatchStatus = "pending";
    let winnerId: string | null = null;
    let loserId: string | null = null;
    let team1Score: number | null = null;
    let team2Score: number | null = null;

    // Check for bye: if one team is missing, the existing team gets an automatic bye
    if (team1 && !team2) {
      status = "bye";
      winnerId = team1.id;
      team1Score = null;
      team2Score = null;
    } else if (!team1 && team2) {
      status = "bye";
      winnerId = team2.id;
      team1Score = null;
      team2Score = null;
    } else if (team1 && team2) {
      status = "ready";
    }

    const match: Match = {
      id: matchId,
      matchNumber: matchCounter++,
      tournamentId: tournament.id,
      bracketType: "single",
      roundNumber: 1,
      roundName,
      team1Id: team1 ? team1.id : null,
      team2Id: team2 ? team2.id : null,
      team1Placeholder: `Seed #${s1}`,
      team2Placeholder: s2 <= N ? `Seed #${s2}` : "BYE",
      team1Score,
      team2Score,
      winnerId,
      loserId,
      status,
      nextMatchId: null, // will link below
      nextMatchSlot: i % 2 === 0 ? "team1" : "team2",
      completedAt: status === "bye" ? new Date().toISOString() : undefined,
    };

    round1Matches.push(match);
    matches.push(match);
  }

  // Generate Rounds 2 to Final
  let previousRoundMatches = round1Matches;

  for (let r = 2; r <= totalRounds; r++) {
    const currentRoundMatches: Match[] = [];
    const numMatches = S / Math.pow(2, r);
    const roundName = getRoundName("single", r, totalRounds);

    for (let i = 0; i < numMatches; i++) {
      const matchId = `SE-R${r}-M${i + 1}`;
      const prevM1 = previousRoundMatches[i * 2];
      const prevM2 = previousRoundMatches[i * 2 + 1];

      // Assign nextMatchId to previous round matches
      prevM1.nextMatchId = matchId;
      prevM1.nextMatchSlot = "team1";
      prevM2.nextMatchId = matchId;
      prevM2.nextMatchSlot = "team2";

      // Check if previous matches already have winners (from Byes)
      const t1Id = prevM1.winnerId;
      const t2Id = prevM2.winnerId;
      // Teams arriving straight from a BYE are marked so the UI can label them.
      const t1Bye = prevM1.status === "bye" && Boolean(t1Id);
      const t2Bye = prevM2.status === "bye" && Boolean(t2Id);

      let status: MatchStatus = "pending";
      if (t1Id && t2Id) {
        status = "ready";
      }

      const match: Match = {
        id: matchId,
        matchNumber: matchCounter++,
        tournamentId: tournament.id,
        bracketType: "single",
        roundNumber: r,
        roundName,
        team1Id: t1Id,
        team2Id: t2Id,
        team1ByeAdvance: t1Bye || undefined,
        team2ByeAdvance: t2Bye || undefined,
        team1Placeholder: `Waiting`,
        team2Placeholder: `Waiting`,
        team1Score: null,
        team2Score: null,
        winnerId: null,
        loserId: null,
        status,
        nextMatchId: null,
        nextMatchSlot: i % 2 === 0 ? "team1" : "team2",
      };

      currentRoundMatches.push(match);
      matches.push(match);
    }

    previousRoundMatches = currentRoundMatches;
  }

  return {
    ...tournament,
    matches,
    bracketGenerated: true,
    status: "ongoing",
    championTeamId: null,
    runnerUpTeamId: null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates complete Double Elimination format:
 * - Winners Bracket
 * - Losers Bracket
 * - Single Grand Final (one match decides the champion)
 */
export function generateDoubleElimination(tournament: Tournament): Tournament {
  const teams = [...tournament.teams];
  const N = teams.length;
  const S = getNextPowerOfTwo(N, 4);
  const W = Math.log2(S); // Total WB rounds
  const totalLbRounds = 2 * (W - 1); // 6 for 16 teams

  const seedToTeam: Record<number, Team> = {};
  teams.forEach((t) => {
    seedToTeam[t.seed] = t;
  });

  const matches: Match[] = [];
  let matchCounter = 1;

  // 1. GENERATE WINNERS BRACKET (WB)
  const wbMatchesByRound: Record<number, Match[]> = {};
  const seedPairs = getStandardSeedPairs(S);
  wbMatchesByRound[1] = [];

  for (let i = 0; i < seedPairs.length; i++) {
    const [s1, s2] = seedPairs[i];
    const team1 = seedToTeam[s1] || null;
    const team2 = seedToTeam[s2] || null;

    const matchId = `WB-R1-M${i + 1}`;
    const roundName = getRoundName("winners", 1, W);

    let status: MatchStatus = "pending";
    let winnerId: string | null = null;
    let team1Score: number | null = null;
    let team2Score: number | null = null;

    if (team1 && !team2) {
      status = "bye";
      winnerId = team1.id;
      team1Score = null;
      team2Score = null;
    } else if (!team1 && team2) {
      status = "bye";
      winnerId = team2.id;
      team1Score = null;
      team2Score = null;
    } else if (team1 && team2) {
      status = "ready";
    }

    const match: Match = {
      id: matchId,
      matchNumber: matchCounter++,
      tournamentId: tournament.id,
      bracketType: "winners",
      roundNumber: 1,
      roundName,
      team1Id: team1 ? team1.id : null,
      team2Id: team2 ? team2.id : null,
      team1Placeholder: `Seed #${s1}`,
      team2Placeholder: s2 <= N ? `Seed #${s2}` : "BYE",
      team1Score,
      team2Score,
      winnerId,
      loserId: null,
      status,
      nextMatchId: null,
      nextMatchSlot: i % 2 === 0 ? "team1" : "team2",
      completedAt: status === "bye" ? new Date().toISOString() : undefined,
    };

    wbMatchesByRound[1].push(match);
    matches.push(match);
  }

  // WB Rounds 2 to W
  for (let r = 2; r <= W; r++) {
    wbMatchesByRound[r] = [];
    const numMatches = S / Math.pow(2, r);
    const roundName = getRoundName("winners", r, W);

    for (let i = 0; i < numMatches; i++) {
      const matchId = `WB-R${r}-M${i + 1}`;
      const prevM1 = wbMatchesByRound[r - 1][i * 2];
      const prevM2 = wbMatchesByRound[r - 1][i * 2 + 1];

      prevM1.nextMatchId = matchId;
      prevM1.nextMatchSlot = "team1";
      prevM2.nextMatchId = matchId;
      prevM2.nextMatchSlot = "team2";

      const t1Id = prevM1.winnerId;
      const t2Id = prevM2.winnerId;
      // Teams arriving straight from a BYE are marked so the UI can label them.
      const t1Bye = prevM1.status === "bye" && Boolean(t1Id);
      const t2Bye = prevM2.status === "bye" && Boolean(t2Id);

      let status: MatchStatus = "pending";
      if (t1Id && t2Id) {
        status = "ready";
      }

      const match: Match = {
        id: matchId,
        matchNumber: matchCounter++,
        tournamentId: tournament.id,
        bracketType: "winners",
        roundNumber: r,
        roundName,
        team1Id: t1Id,
        team2Id: t2Id,
        team1ByeAdvance: t1Bye || undefined,
        team2ByeAdvance: t2Bye || undefined,
        team1Placeholder: `Waiting`,
        team2Placeholder: `Waiting`,
        team1Score: null,
        team2Score: null,
        winnerId: null,
        loserId: null,
        status,
        nextMatchId: null,
        nextMatchSlot: i % 2 === 0 ? "team1" : "team2",
      };

      wbMatchesByRound[r].push(match);
      matches.push(match);
    }
  }

  // 2. GENERATE LOSERS BRACKET (LB)
  const lbMatchesByRound: Record<number, Match[]> = {};

  // LB Round 1: takes losers from WB Round 1
  // WB R1 has S/2 matches -> LB R1 has S/4 matches
  lbMatchesByRound[1] = [];
  const lbR1Count = S / 4;
  for (let i = 0; i < lbR1Count; i++) {
    const matchId = `LB-R1-M${i + 1}`;
    const wbLossM1 = wbMatchesByRound[1][i * 2];
    const wbLossM2 = wbMatchesByRound[1][i * 2 + 1];

    wbLossM1.loserNextMatchId = matchId;
    wbLossM1.loserNextMatchSlot = "team1";
    wbLossM2.loserNextMatchId = matchId;
    wbLossM2.loserNextMatchSlot = "team2";

    // If WB R1 was a bye, there is no loser
    const match: Match = {
      id: matchId,
      matchNumber: matchCounter++,
      tournamentId: tournament.id,
      bracketType: "losers",
      roundNumber: 1,
      roundName: getRoundName("losers", 1, totalLbRounds),
      team1Id: null,
      team2Id: null,
      team1Placeholder: `Waiting`,
      team2Placeholder: `Waiting`,
      team1Score: null,
      team2Score: null,
      winnerId: null,
      loserId: null,
      status: "pending",
      nextMatchId: null,
      nextMatchSlot: "team1",
    };

    lbMatchesByRound[1].push(match);
    matches.push(match);
  }

  // LB Rounds 2 through totalLbRounds:
  // Alternating between "Major" (drop from WB) and "Minor" (LB winners vs each other)
  // Total LB rounds: 2*(W-1)
  // For each WB round w from 2 to W:
  //   LB round (2*w - 2): Takes LB winner vs WB Rw loser. Count = S / 2^w.
  //   If w < W:
  //     LB round (2*w - 1): Takes winners of previous LB round playing each other. Count = S / 2^(w+1).
  for (let w = 2; w <= W; w++) {
    const lbDropRoundNum = 2 * w - 2;
    const dropMatchesCount = S / Math.pow(2, w);
    lbMatchesByRound[lbDropRoundNum] = [];

    // Drop round: LB winner plays loser dropping from WB Rw
    for (let i = 0; i < dropMatchesCount; i++) {
      const matchId = `LB-R${lbDropRoundNum}-M${i + 1}`;
      const prevLbMatch = lbMatchesByRound[lbDropRoundNum - 1][i];
      const wbDropMatch = wbMatchesByRound[w][i];

      prevLbMatch.nextMatchId = matchId;
      prevLbMatch.nextMatchSlot = "team1";

      wbDropMatch.loserNextMatchId = matchId;
      wbDropMatch.loserNextMatchSlot = "team2";

      const match: Match = {
        id: matchId,
        matchNumber: matchCounter++,
        tournamentId: tournament.id,
        bracketType: "losers",
        roundNumber: lbDropRoundNum,
        roundName: getRoundName("losers", lbDropRoundNum, totalLbRounds),
        team1Id: null,
        team2Id: null,
        team1Placeholder: `Waiting`,
        team2Placeholder: `Waiting`,
        team1Score: null,
        team2Score: null,
        winnerId: null,
        loserId: null,
        status: "pending",
        nextMatchId: null,
        nextMatchSlot: i % 2 === 0 ? "team1" : "team2",
      };

      lbMatchesByRound[lbDropRoundNum].push(match);
      matches.push(match);
    }

    // Next round: LB winners play each other (only if not at LB Final)
    if (w < W) {
      const lbIntRoundNum = 2 * w - 1;
      const intMatchesCount = dropMatchesCount / 2;
      lbMatchesByRound[lbIntRoundNum] = [];

      for (let i = 0; i < intMatchesCount; i++) {
        const matchId = `LB-R${lbIntRoundNum}-M${i + 1}`;
        const prevM1 = lbMatchesByRound[lbDropRoundNum][i * 2];
        const prevM2 = lbMatchesByRound[lbDropRoundNum][i * 2 + 1];

        prevM1.nextMatchId = matchId;
        prevM1.nextMatchSlot = "team1";
        prevM2.nextMatchId = matchId;
        prevM2.nextMatchSlot = "team2";

        const match: Match = {
          id: matchId,
          matchNumber: matchCounter++,
          tournamentId: tournament.id,
          bracketType: "losers",
          roundNumber: lbIntRoundNum,
          roundName: getRoundName("losers", lbIntRoundNum, totalLbRounds),
          team1Id: null,
          team2Id: null,
          team1Placeholder: `Waiting`,
          team2Placeholder: `Waiting`,
          team1Score: null,
          team2Score: null,
          winnerId: null,
          loserId: null,
          status: "pending",
          nextMatchId: null,
          nextMatchSlot: "team1",
        };

        lbMatchesByRound[lbIntRoundNum].push(match);
        matches.push(match);
      }
    }
  }

  // 3. GRAND FINAL
  const wbFinalMatch = wbMatchesByRound[W][0];
  const lbFinalMatch = lbMatchesByRound[totalLbRounds][0];

  const grandFinalId = "GF-M1";
  wbFinalMatch.nextMatchId = grandFinalId;
  wbFinalMatch.nextMatchSlot = "team1";

  lbFinalMatch.nextMatchId = grandFinalId;
  lbFinalMatch.nextMatchSlot = "team2";

  const grandFinalMatch: Match = {
    id: grandFinalId,
    matchNumber: matchCounter++,
    tournamentId: tournament.id,
    bracketType: "grand_final",
    roundNumber: 1,
    roundName: "Grand Final",
    team1Id: null,
    team2Id: null,
    team1Placeholder: `Waiting`,
    team2Placeholder: `Waiting`,
    team1Score: null,
    team2Score: null,
    winnerId: null,
    loserId: null,
    status: "pending",
    nextMatchId: null,
  };
  matches.push(grandFinalMatch);

  return {
    ...tournament,
    matches,
    bracketGenerated: true,
    status: "ongoing",
    championTeamId: null,
    runnerUpTeamId: null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Main bracket generator entry point.
 */
export function generateTournamentBracket(tournament: Tournament): Tournament {
  const check = canGenerateBracket(tournament);
  if (!check.canGenerate) {
    throw new Error(check.reason || "Cannot generate bracket.");
  }

  // Fresh start: generating (or regenerating) always resets team losses,
  // champion/runner-up and status alongside the rebuilt matches.
  let tournamentToGenerate: Tournament = {
    ...tournament,
    teams: tournament.teams.map((t) => ({ ...t, losses: 0 })),
    championTeamId: null,
    runnerUpTeamId: null,
  };
  if (tournament.settings.seedingMethod === "random") {
    const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);
    shuffledTeams.forEach((t, index) => {
      t.seed = index + 1;
    });
    tournamentToGenerate.teams = shuffledTeams;
  }

  if (tournament.settings.format === "double_elimination") {
    return generateDoubleElimination(tournamentToGenerate);
  }
  return generateSingleElimination(tournamentToGenerate);
}

/**
 * Recomputes all team losses based on current match results.
 */
export function recomputeTeamLosses(tournament: Tournament): Tournament {
  const lossCounts: Record<string, number> = {};
  tournament.teams.forEach((t) => {
    lossCounts[t.id] = 0;
  });

  tournament.matches.forEach((m) => {
    if (m.status === "completed" && m.loserId) {
      lossCounts[m.loserId] = (lossCounts[m.loserId] || 0) + 1;
    }
  });

  const updatedTeams = tournament.teams.map((t) => ({
    ...t,
    losses: lossCounts[t.id] || 0,
  }));

  return {
    ...tournament,
    teams: updatedTeams,
  };
}

/**
 * Advances a winner from a match, updating downstream matches and tournament status.
 */
export function recordMatchResult(
  tournament: Tournament,
  matchId: string,
  winnerId: string,
  team1Score: number | null,
  team2Score: number | null,
): Tournament {
  const matchIndex = tournament.matches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) throw new Error("Match not found");

  const match = { ...tournament.matches[matchIndex] };
  if (!match.team1Id || !match.team2Id) {
    throw new Error("Both teams must be present to record a match result.");
  }

  const loserId = match.team1Id === winnerId ? match.team2Id : match.team1Id;
  const isTeam1Winner = match.team1Id === winnerId;

  // Validate scores if numerical
  if (team1Score !== null && team2Score !== null) {
    if (team1Score === team2Score) {
      throw new Error(
        "Scores cannot be tied. A clear winner must be determined.",
      );
    }
    if (
      (team1Score > team2Score && !isTeam1Winner) ||
      (team2Score > team1Score && isTeam1Winner)
    ) {
      throw new Error("Scores must be consistent with the selected winner.");
    }
  }

  match.team1Score = team1Score;
  match.team2Score = team2Score;
  match.winnerId = winnerId;
  match.loserId = loserId;
  match.status = "completed";
  match.completedAt = new Date().toISOString();

  const updatedMatches = [...tournament.matches];
  updatedMatches[matchIndex] = match;

  let championId = tournament.championTeamId;
  let runnerUpId = tournament.runnerUpTeamId;
  let tournamentStatus = tournament.status;

  // 1. Advance winner to nextMatchId
  if (match.nextMatchId) {
    const nextMatchIdx = updatedMatches.findIndex(
      (m) => m.id === match.nextMatchId,
    );
    if (nextMatchIdx !== -1) {
      const nextMatch = { ...updatedMatches[nextMatchIdx] };

      // Standard winner advance (a played win clears any BYE-arrival marker)
      if (match.nextMatchSlot === "team1") {
        nextMatch.team1Id = winnerId;
        nextMatch.team1Placeholder = undefined;
        nextMatch.team1ByeAdvance = undefined;
      } else {
        nextMatch.team2Id = winnerId;
        nextMatch.team2Placeholder = undefined;
        nextMatch.team2ByeAdvance = undefined;
      }

      if (nextMatch.team1Id && nextMatch.team2Id) {
        nextMatch.status = "ready";
      }
      updatedMatches[nextMatchIdx] = nextMatch;
    }
  } else {
    // If no nextMatchId: this is a Final match (single-elim final or
    // double-elim Grand Final). One match decides it — winner is champion.
    if (match.bracketType === "single" || match.bracketType === "grand_final") {
      championId = winnerId;
      runnerUpId = loserId;
      tournamentStatus = "completed";
    }
  }

  // 2. Advance loser in Double Elimination
  if (match.loserNextMatchId && loserId) {
    const loserNextMatchIdx = updatedMatches.findIndex(
      (m) => m.id === match.loserNextMatchId,
    );
    if (loserNextMatchIdx !== -1) {
      const loserNextMatch = { ...updatedMatches[loserNextMatchIdx] };
      if (match.loserNextMatchSlot === "team1") {
        loserNextMatch.team1Id = loserId;
        loserNextMatch.team1Placeholder = undefined;
        loserNextMatch.team1ByeAdvance = undefined;
      } else {
        loserNextMatch.team2Id = loserId;
        loserNextMatch.team2Placeholder = undefined;
        loserNextMatch.team2ByeAdvance = undefined;
      }

      if (loserNextMatch.team1Id && loserNextMatch.team2Id) {
        loserNextMatch.status = "ready";
      }
      updatedMatches[loserNextMatchIdx] = loserNextMatch;
    }
  }

  const updatedTournament: Tournament = {
    ...tournament,
    matches: updatedMatches,
    championTeamId: championId,
    runnerUpTeamId: runnerUpId,
    status: tournamentStatus,
    updatedAt: new Date().toISOString(),
  };

  return recomputeTeamLosses(updatedTournament);
}

/**
 * Resets a completed or ongoing match back to ready/pending,
 * and clears any downstream matches that relied on this result.
 */
export function resetMatchResult(
  tournament: Tournament,
  matchId: string,
): Tournament {
  const matchIndex = tournament.matches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) throw new Error("Match not found");

  const targetMatch = tournament.matches[matchIndex];
  const oldWinnerId = targetMatch.winnerId;
  const oldLoserId = targetMatch.loserId;

  // Work on copies so upstream reads stay stable while we clear downstream.
  const updatedMatches = tournament.matches.map((m) => ({ ...m }));
  const byId = new Map(updatedMatches.map((m) => [m.id, m]));

  // 1. Reset the target match itself (teams stay, result is cleared).
  const target = byId.get(matchId)!;
  target.team1Score = null;
  target.team2Score = null;
  target.winnerId = null;
  target.loserId = null;
  target.completedAt = undefined;
  target.status = (
    target.team1Id && target.team2Id ? "ready" : "pending"
  ) as MatchStatus;

  // 2. Walk downstream slot-by-slot. A downstream slot is only cleared when it
  // still holds the exact team that this result chain placed there — matches
  // fed from other branches are left untouched.
  interface ClearTask {
    matchId: string;
    slot: "team1" | "team2";
    expectedTeamId: string;
    feederMatchNumber: number;
    isLoserPath: boolean;
  }

  const queue: ClearTask[] = [];
  if (target.nextMatchId && target.nextMatchSlot && oldWinnerId) {
    queue.push({
      matchId: target.nextMatchId,
      slot: target.nextMatchSlot,
      expectedTeamId: oldWinnerId,
      feederMatchNumber: target.matchNumber,
      isLoserPath: false,
    });
  }
  if (target.loserNextMatchId && target.loserNextMatchSlot && oldLoserId) {
    queue.push({
      matchId: target.loserNextMatchId,
      slot: target.loserNextMatchSlot,
      expectedTeamId: oldLoserId,
      feederMatchNumber: target.matchNumber,
      isLoserPath: true,
    });
  }

  while (queue.length > 0) {
    const task = queue.shift()!;
    const m = byId.get(task.matchId);
    if (!m) continue;

    const current = task.slot === "team1" ? m.team1Id : m.team2Id;
    if (current !== task.expectedTeamId) continue; // Fed from another path — leave it.

    // Clear only the affected slot and restore its placeholder.
    const restoredPlaceholder = task.isLoserPath ? `Waiting` : `Waiting`;
    if (task.slot === "team1") {
      m.team1Id = null;
      m.team1Placeholder = restoredPlaceholder;
      m.team1ByeAdvance = undefined;
    } else {
      m.team2Id = null;
      m.team2Placeholder = restoredPlaceholder;
      m.team2ByeAdvance = undefined;
    }

    // Its result (if any) is now invalid — capture for further propagation.
    const downstreamWinner = m.winnerId;
    const downstreamLoser = m.loserId;
    m.team1Score = null;
    m.team2Score = null;
    m.winnerId = null;
    m.loserId = null;
    m.completedAt = undefined;
    m.status = "pending";

    if (m.nextMatchId && m.nextMatchSlot && downstreamWinner) {
      queue.push({
        matchId: m.nextMatchId,
        slot: m.nextMatchSlot,
        expectedTeamId: downstreamWinner,
        feederMatchNumber: m.matchNumber,
        isLoserPath: false,
      });
    }
    if (m.loserNextMatchId && m.loserNextMatchSlot && downstreamLoser) {
      queue.push({
        matchId: m.loserNextMatchId,
        slot: m.loserNextMatchSlot,
        expectedTeamId: downstreamLoser,
        feederMatchNumber: m.matchNumber,
        isLoserPath: true,
      });
    }
  }

  const updatedTournament: Tournament = {
    ...tournament,
    matches: updatedMatches,
    championTeamId: null,
    runnerUpTeamId: null,
    status: "ongoing",
    updatedAt: new Date().toISOString(),
  };

  return recomputeTeamLosses(updatedTournament);
}
