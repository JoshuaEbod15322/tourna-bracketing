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
 * - Even team counts: no extra / BYE cards, direct pairings.
 * - Odd team counts: leftover team auto-advances to the next round,
 *   no extra BYE card is created.
 * - A team never gets stuck waiting on an opponent that can never arrive:
 *   every downstream slot is fed only by real matches or by carried
 *   bye-teams, never by a phantom BYE loser.
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

  type Slot = { match: Match | null; byeTeamId: string | null };

  // Round 1 seed pairings — only real pairings become cards.
  const seedPairs = getStandardSeedPairs(S);
  const round1Slots: Slot[] = [];
  const round1Matches: Match[] = [];

  for (let i = 0; i < seedPairs.length; i++) {
    const [s1, s2] = seedPairs[i];
    const team1 = seedToTeam[s1] || null;
    const team2 = seedToTeam[s2] || null;

    if (team1 && team2) {
      const matchId = `SE-R1-M${round1Matches.length + 1}`;
      const roundName = getRoundName("single", 1, totalRounds);
      const match: Match = {
        id: matchId,
        matchNumber: matchCounter++,
        tournamentId: tournament.id,
        bracketType: "single",
        roundNumber: 1,
        roundName,
        team1Id: team1.id,
        team2Id: team2.id,
        team1Placeholder: `Seed #${s1}`,
        team2Placeholder: `Seed #${s2}`,
        team1Score: null,
        team2Score: null,
        winnerId: null,
        loserId: null,
        status: "ready",
        nextMatchId: null,
        nextMatchSlot: i % 2 === 0 ? "team1" : "team2",
      };
      round1Matches.push(match);
      matches.push(match);
      round1Slots.push({ match, byeTeamId: null });
    } else if (team1 || team2) {
      // Odd-team out (or even-team bye slot): auto-advance, no card.
      const byeTeam = (team1 || team2)!;
      round1Slots.push({ match: null, byeTeamId: byeTeam.id });
    } else {
      round1Slots.push({ match: null, byeTeamId: null });
    }
  }

  // Generate Rounds 2 to Final from slots (real winners + carried byes).
  let previousSlots = round1Slots;

  for (let r = 2; r <= totalRounds; r++) {
    const numMatches = S / Math.pow(2, r);
    const roundName = getRoundName("single", r, totalRounds);
    const currentMatches: Match[] = [];
    const currentSlots: Slot[] = [];

    for (let i = 0; i < numMatches; i++) {
      const f1 = previousSlots[i * 2];
      const f2 = previousSlots[i * 2 + 1];
      if (!f1 && !f2) {
        currentSlots.push({ match: null, byeTeamId: null });
        continue;
      }
      const feeder1 = f1 || { match: null, byeTeamId: null };
      const feeder2 = f2 || { match: null, byeTeamId: null };

      const t1Id =
        feeder1.match?.winnerId ?? feeder1.byeTeamId ?? null;
      const t2Id =
        feeder2.match?.winnerId ?? feeder2.byeTeamId ?? null;
      const t1Bye = !feeder1.match && Boolean(feeder1.byeTeamId);
      const t2Bye = !feeder2.match && Boolean(feeder2.byeTeamId);

      // Skip only slots that can NEVER produce a team (both feeders empty).
      // A feeder with a real (unplayed) match is viable: its winner arrives later.
      const f1Viable = Boolean(feeder1.match) || Boolean(feeder1.byeTeamId);
      const f2Viable = Boolean(feeder2.match) || Boolean(feeder2.byeTeamId);
      if (!f1Viable && !f2Viable) {
        currentSlots.push({ match: null, byeTeamId: null });
        continue;
      }

      const matchId = `SE-R${r}-M${currentMatches.length + 1}`;

      if (feeder1.match) {
        feeder1.match.nextMatchId = matchId;
        feeder1.match.nextMatchSlot = "team1";
      }
      if (feeder2.match) {
        feeder2.match.nextMatchId = matchId;
        feeder2.match.nextMatchSlot = "team2";
      }

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

      currentMatches.push(match);
      matches.push(match);
      currentSlots.push({ match, byeTeamId: null });
    }

    previousSlots = currentSlots;
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
 * - Winners Bracket (no BYE cards; byes auto-advance, no new card)
 * - Losers Bracket (built only from real losers, no dead TBD slots)
 * - Single Grand Final (one match decides the champion)
 */
export function generateDoubleElimination(tournament: Tournament): Tournament {
  const teams = [...tournament.teams];
  const N = teams.length;
  const S = getNextPowerOfTwo(N, 4);
  const W = Math.log2(S); // Total WB rounds
  const totalLbRounds = 2 * (W - 1);

  const seedToTeam: Record<number, Team> = {};
  teams.forEach((t) => {
    seedToTeam[t.seed] = t;
  });

  const matches: Match[] = [];
  let matchCounter = 1;

  type WbSlot = { match: Match | null; byeTeamId: string | null };

  // 1. WINNERS BRACKET — no BYE cards.
  const wbMatchesByRound: Record<number, Match[]> = {};
  const seedPairs = getStandardSeedPairs(S);
  wbMatchesByRound[1] = [];
  const wbR1Slots: WbSlot[] = [];

  for (let i = 0; i < seedPairs.length; i++) {
    const [s1, s2] = seedPairs[i];
    const team1 = seedToTeam[s1] || null;
    const team2 = seedToTeam[s2] || null;

    if (team1 && team2) {
      const matchId = `WB-R1-M${wbMatchesByRound[1].length + 1}`;
      const roundName = getRoundName("winners", 1, W);
      const match: Match = {
        id: matchId,
        matchNumber: matchCounter++,
        tournamentId: tournament.id,
        bracketType: "winners",
        roundNumber: 1,
        roundName,
        team1Id: team1.id,
        team2Id: team2.id,
        team1Placeholder: `Seed #${s1}`,
        team2Placeholder: `Seed #${s2}`,
        team1Score: null,
        team2Score: null,
        winnerId: null,
        loserId: null,
        status: "ready",
        nextMatchId: null,
        nextMatchSlot: i % 2 === 0 ? "team1" : "team2",
      };
      wbMatchesByRound[1].push(match);
      matches.push(match);
      wbR1Slots.push({ match, byeTeamId: null });
    } else if (team1 || team2) {
      // Odd team out: auto-advance to WB-R2, no new card.
      const byeTeam = (team1 || team2)!;
      wbR1Slots.push({ match: null, byeTeamId: byeTeam.id });
    } else {
      wbR1Slots.push({ match: null, byeTeamId: null });
    }
  }

  // WB Rounds 2..W from slots (real winners + carried bye teams).
  let prevWbSlots: WbSlot[] = wbR1Slots;
  for (let r = 2; r <= W; r++) {
    wbMatchesByRound[r] = [];
    const numMatches = S / Math.pow(2, r);
    const roundName = getRoundName("winners", r, W);
    const curSlots: WbSlot[] = [];

    for (let i = 0; i < numMatches; i++) {
      const f1 = prevWbSlots[i * 2] || { match: null, byeTeamId: null };
      const f2 = prevWbSlots[i * 2 + 1] || { match: null, byeTeamId: null };

      const t1Id = f1.match?.winnerId ?? f1.byeTeamId ?? null;
      const t2Id = f2.match?.winnerId ?? f2.byeTeamId ?? null;
      const t1Bye = !f1.match && Boolean(f1.byeTeamId);
      const t2Bye = !f2.match && Boolean(f2.byeTeamId);

      // Skip only slots that can NEVER produce a team. Unplayed real
      // matches are viable feeders — their winners arrive via recordMatchResult.
      const f1Viable = Boolean(f1.match) || Boolean(f1.byeTeamId);
      const f2Viable = Boolean(f2.match) || Boolean(f2.byeTeamId);
      if (!f1Viable && !f2Viable) {
        curSlots.push({ match: null, byeTeamId: null });
        continue;
      }

      const matchId = `WB-R${r}-M${wbMatchesByRound[r].length + 1}`;
      if (f1.match) {
        f1.match.nextMatchId = matchId;
        f1.match.nextMatchSlot = "team1";
      }
      if (f2.match) {
        f2.match.nextMatchId = matchId;
        f2.match.nextMatchSlot = "team2";
      }

      let status: MatchStatus = "pending";
      if (t1Id && t2Id) status = "ready";

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
      curSlots.push({ match, byeTeamId: null });
    }
    prevWbSlots = curSlots;
  }

  // 2. LOSERS BRACKET — only from real losers, never a dead TBD slot.
  // Every LB card created here has two genuine feeders (LB winner and/or
  // WB loser), so no team waits forever on an opponent that cannot arrive.
  type LbFeeder =
    | { kind: "wbLoser"; match: Match }
    | { kind: "lbWinner"; match: Match };

  const lbMatchesByRound: Record<number, Match[]> = {};
  const wbR1Real = wbMatchesByRound[1] || [];

  const linkWbLoser = (wb: Match, lb: Match, slot: "team1" | "team2") => {
    wb.loserNextMatchId = lb.id;
    wb.loserNextMatchSlot = slot;
  };
  const linkLbWinner = (prev: Match, lb: Match, slot: "team1" | "team2") => {
    prev.nextMatchId = lb.id;
    prev.nextMatchSlot = slot;
  };
  const linkFeederToSlot = (feeder: LbFeeder, lb: Match, slot: "team1" | "team2") => {
    if (feeder.kind === "wbLoser") linkWbLoser(feeder.match, lb, slot);
    else linkLbWinner(feeder.match, lb, slot);
  };

  const makeLbMatch = (roundNum: number, seq: number): Match => {
    const m: Match = {
      id: `LB-R${roundNum}-M${seq}`,
      matchNumber: matchCounter++,
      tournamentId: tournament.id,
      bracketType: "losers",
      roundNumber: roundNum,
      roundName: getRoundName("losers", roundNum, totalLbRounds),
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
    matches.push(m);
    if (!lbMatchesByRound[roundNum]) lbMatchesByRound[roundNum] = [];
    lbMatchesByRound[roundNum].push(m);
    return m;
  };

  // LB-R1: pair real WB-R1 losers sequentially. Odd leftover carries forward
  // as an auto-advance (no new card for it).
  let carryPool: LbFeeder[] = [];
  if (wbR1Real.length >= 2) {
    const pairs = Math.floor(wbR1Real.length / 2);
    for (let i = 0; i < pairs; i++) {
      const lb = makeLbMatch(1, i + 1);
      linkWbLoser(wbR1Real[i * 2], lb, "team1");
      linkWbLoser(wbR1Real[i * 2 + 1], lb, "team2");
    }
    const created = lbMatchesByRound[1] || [];
    carryPool = created.map((m) => ({ kind: "lbWinner", match: m }) as LbFeeder);
    if (wbR1Real.length % 2 === 1) {
      carryPool.push({
        kind: "wbLoser",
        match: wbR1Real[wbR1Real.length - 1],
      });
    }
  } else if (wbR1Real.length === 1) {
    carryPool = [{ kind: "wbLoser", match: wbR1Real[0] }];
  }
  let carryWbExcess: Match[] = [];

  for (let w = 2; w <= W; w++) {
    const lbDropNum = 2 * w - 2;
    const wbList = wbMatchesByRound[w] || [];
    const wbAvail: Match[] = [...carryWbExcess, ...wbList];
    const dropCount = Math.min(carryPool.length, wbAvail.length);
    const dropMatches: Match[] = [];
    for (let i = 0; i < dropCount; i++) {
      const lb = makeLbMatch(lbDropNum, i + 1);
      linkFeederToSlot(carryPool[i], lb, "team1");
      linkWbLoser(wbAvail[i], lb, "team2");
      // Alternate outgoing slot to keep connector geometry stable.
      lb.nextMatchSlot = i % 2 === 0 ? "team1" : "team2";
      dropMatches.push(lb);
    }
    const usedPool = carryPool.slice(0, dropCount);
    void usedPool;
    carryPool = carryPool.slice(dropCount);
    carryWbExcess = wbAvail.slice(dropCount);

    if (w < W) {
      // Intermediate round: drop winners (+ carried pool) play each other.
      const lbIntNum = 2 * w - 1;
      const intFeeders: LbFeeder[] = [
        ...dropMatches.map(
          (m) => ({ kind: "lbWinner", match: m }) as LbFeeder,
        ),
        ...carryPool,
      ];
      carryPool = [];
      const intCount = Math.floor(intFeeders.length / 2);
      for (let i = 0; i < intCount; i++) {
        const lb = makeLbMatch(lbIntNum, i + 1);
        linkFeederToSlot(intFeeders[i * 2], lb, "team1");
        linkFeederToSlot(intFeeders[i * 2 + 1], lb, "team2");
        lb.nextMatchSlot = "team1";
      }
      const createdInt = lbMatchesByRound[lbIntNum] || [];
      const nextPool: LbFeeder[] = createdInt.map(
        (m) => ({ kind: "lbWinner", match: m }) as LbFeeder,
      );
      if (intFeeders.length % 2 === 1) {
        nextPool.push(intFeeders[intFeeders.length - 1]);
      }
      carryPool = nextPool;
    } else {
      // Final WB round: drop winners feed the LB final resolution below.
      carryPool = [
        ...dropMatches.map(
          (m) => ({ kind: "lbWinner", match: m }) as LbFeeder,
        ),
        ...carryPool,
      ];
    }
  }

  // Resolve any leftovers to a single LB champion (no dead 1-team cards:
  // leftovers play each other, odd one carries forward).
  let playoffRound =
    Math.max(0, ...Object.keys(lbMatchesByRound).map(Number)) + 1;
  if (playoffRound < 1) playoffRound = totalLbRounds;
  let finalPool: LbFeeder[] = [...carryPool];
  // carryWbExcess holds WB matches whose losers never got an LB slot.
  for (const wb of carryWbExcess) {
    finalPool.push({ kind: "wbLoser", match: wb });
  }
  while (finalPool.length > 1) {
    const roundNum = playoffRound <= totalLbRounds ? playoffRound : playoffRound;
    const count = Math.floor(finalPool.length / 2);
    const created: Match[] = [];
    for (let i = 0; i < count; i++) {
      const lb = makeLbMatch(roundNum, i + 1);
      linkFeederToSlot(finalPool[i * 2], lb, "team1");
      linkFeederToSlot(finalPool[i * 2 + 1], lb, "team2");
      lb.nextMatchSlot = "team1";
      created.push(lb);
    }
    const next: LbFeeder[] = created.map(
      (m) => ({ kind: "lbWinner", match: m }) as LbFeeder,
    );
    if (finalPool.length % 2 === 1) {
      next.push(finalPool[finalPool.length - 1]);
    }
    finalPool = next;
    playoffRound += 1;
  }

  // 3. GRAND FINAL — WB champion vs LB champion (or carried WB loser if
  // the LB collapsed to a single carried feeder, e.g. 2-team tourney).
  const wbFinalMatch = wbMatchesByRound[W]?.[0];
  const lbRoundNums = Object.keys(lbMatchesByRound)
    .map(Number)
    .sort((a, b) => a - b);
  const lastLbRound = lbRoundNums.length
    ? lbMatchesByRound[lbRoundNums[lbRoundNums.length - 1]]
    : [];
  const lbFinalMatch = lastLbRound.length === 1 ? lastLbRound[0] : null;

  const grandFinalId = "GF-M1";
  if (wbFinalMatch) {
    wbFinalMatch.nextMatchId = grandFinalId;
    wbFinalMatch.nextMatchSlot = "team1";
  }
  if (lbFinalMatch) {
    lbFinalMatch.nextMatchId = grandFinalId;
    lbFinalMatch.nextMatchSlot = "team2";
  } else if (finalPool.length === 1) {
    // No LB final card (tiny bracket): route the lone survivor to the final.
    const lone = finalPool[0];
    if (lone.kind === "wbLoser") {
      lone.match.loserNextMatchId = grandFinalId;
      lone.match.loserNextMatchSlot = "team2";
    } else {
      lone.match.nextMatchId = grandFinalId;
      lone.match.nextMatchSlot = "team2";
    }
  }

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

  const wasCompleted = match.status === "completed";
  const oldWinnerId = match.winnerId;
  const oldLoserId = match.loserId;

  match.team1Score = team1Score;
  match.team2Score = team2Score;
  match.winnerId = winnerId;
  match.loserId = loserId;
  match.status = "completed";
  match.completedAt = new Date().toISOString();

  const updatedMatches = [...tournament.matches];
  updatedMatches[matchIndex] = match;

  // If editing a completed match with a changed winner, the old winner/loser
  // may already sit in downstream cards (including Lower Bracket) with played
  // results built on them. Clear those stale downstream slots/results first so
  // the Lower Bracket is recalculated instead of corrupted.
  if (wasCompleted && (oldWinnerId !== winnerId || oldLoserId !== loserId)) {
    const byId = new Map(updatedMatches.map((m) => [m.id, m]));
    // Operate on the live objects inside updatedMatches via the map.
    for (let i = 0; i < updatedMatches.length; i++) {
      byId.set(updatedMatches[i].id, updatedMatches[i]);
    }
    interface ClearTask {
      matchId: string;
      slot: "team1" | "team2";
      expectedTeamId: string;
      isLoserPath: boolean;
    }
    const queue: ClearTask[] = [];
    // Only clear paths whose team actually changed.
    if (oldWinnerId && oldWinnerId !== winnerId && match.nextMatchId && match.nextMatchSlot) {
      queue.push({
        matchId: match.nextMatchId,
        slot: match.nextMatchSlot,
        expectedTeamId: oldWinnerId,
        isLoserPath: false,
      });
    }
    if (oldLoserId && oldLoserId !== loserId && match.loserNextMatchId && match.loserNextMatchSlot) {
      queue.push({
        matchId: match.loserNextMatchId,
        slot: match.loserNextMatchSlot,
        expectedTeamId: oldLoserId,
        isLoserPath: true,
      });
    }
    while (queue.length > 0) {
      const task = queue.shift()!;
      const idx = updatedMatches.findIndex((m) => m.id === task.matchId);
      if (idx === -1) continue;
      const m = { ...updatedMatches[idx] };
      const current = task.slot === "team1" ? m.team1Id : m.team2Id;
      if (current !== task.expectedTeamId) continue;
      if (task.slot === "team1") {
        m.team1Id = null;
        m.team1Placeholder = "Waiting";
        m.team1ByeAdvance = undefined;
      } else {
        m.team2Id = null;
        m.team2Placeholder = "Waiting";
        m.team2ByeAdvance = undefined;
      }
      const downstreamWinner = m.winnerId;
      const downstreamLoser = m.loserId;
      m.team1Score = null;
      m.team2Score = null;
      m.winnerId = null;
      m.loserId = null;
      m.completedAt = undefined;
      m.status = "pending";
      updatedMatches[idx] = m;
      if (m.nextMatchId && m.nextMatchSlot && downstreamWinner) {
        queue.push({
          matchId: m.nextMatchId,
          slot: m.nextMatchSlot,
          expectedTeamId: downstreamWinner,
          isLoserPath: false,
        });
      }
      if (m.loserNextMatchId && m.loserNextMatchSlot && downstreamLoser) {
        queue.push({
          matchId: m.loserNextMatchId,
          slot: m.loserNextMatchSlot,
          expectedTeamId: downstreamLoser,
          isLoserPath: true,
        });
      }
    }
  }

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
