import React, { useState } from "react";
import { Match, Tournament } from "../../types/tournament";
import { MatchCard } from "./MatchCard";
import { ChampionBanner } from "./ChampionBanner";
import { BracketZoomControls } from "./BracketZoomControls";
import { BracketFork, ElbowConnector } from "./BracketConnector";

interface SingleEliminationBracketProps {
  tournament: Tournament;
  onOpenScore: (match: Match) => void;
  onResetMatch: (matchId: string) => void;
}

export const SingleEliminationBracket: React.FC<
  SingleEliminationBracketProps
> = ({ tournament, onOpenScore, onResetMatch }) => {
  const [zoom, setZoom] = useState(1);

  const matches = tournament.matches.filter((m) => m.bracketType === "single");

  // Group matches by round number
  const roundsMap = new Map<number, Match[]>();
  matches.forEach((m) => {
    const list = roundsMap.get(m.roundNumber) || [];
    list.push(m);
    roundsMap.set(m.roundNumber, list);
  });

  const sortedRoundNumbers = Array.from(roundsMap.keys()).sort((a, b) => a - b);

  const championTeam = tournament.championTeamId
    ? tournament.teams.find((t) => t.id === tournament.championTeamId) || null
    : null;

  const runnerUpTeam = tournament.runnerUpTeamId
    ? tournament.teams.find((t) => t.id === tournament.runnerUpTeamId) || null
    : null;

  if (matches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No matches generated yet.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Make sure at least 2 teams are registered and click &ldquo;Generate
          Bracket&rdquo;.
        </p>
      </div>
    );
  }

  // Base slot height: match card is 128px high + 32px vertical gap = 160px.
  // The tree must fit its LARGEST round (odd-team byes can make later
  // rounds bigger than round 1), and each round spreads its cards evenly.
  const baseSlotHeight = 160;
  const connectorWidth = 56;
  const maxRoundCount = Math.max(
    ...Array.from(roundsMap.values()).map((list) => list.length),
    1,
  );
  const totalTreeHeight = Math.max(maxRoundCount * baseSlotHeight, 320);

  return (
    <div className="space-y-6">
      {championTeam && (
        <ChampionBanner
          tournament={tournament}
          champion={championTeam}
          runnerUp={runnerUpTeam}
        />
      )}

      {/* Full-page bracket board (no enclosing card) */}
      <div>
        {/* Toolbar */}
        <div className="flex items-center justify-between py-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Single Elimination Bracket
            </span>
            <span className="text-xs text-slate-400 font-mono">
              · {matches.length} Matches · {sortedRoundNumbers.length} Rounds
            </span>
          </div>

          {/* Zoom controls */}
          <BracketZoomControls
            zoom={zoom}
            onZoomIn={() =>
              setZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))))
            }
            onZoomOut={() =>
              setZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))
            }
            onResetZoom={() => setZoom(1)}
          />
        </div>

        {/* Full-page scrollable / zoomable bracket viewport */}
        <div className="no-scrollbar overflow-auto py-2 relative">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: "max-content",
            }}
            className="transition-transform duration-100 ease-out flex flex-col"
          >
            {/* 1. SEPARATE ROUND HEADERS ROW (guarantees perfect vertical alignment) */}
            <div className="flex items-end mb-6 select-none">
              {sortedRoundNumbers.map((roundNum, roundIdx) => {
                const roundMatches = roundsMap.get(roundNum) || [];
                const roundTitle =
                  roundMatches[0]?.roundName || `Round ${roundNum}`;
                const isLastRound = roundIdx === sortedRoundNumbers.length - 1;

                return (
                  <React.Fragment key={roundNum}>
                    {!isLastRound && (
                      <div
                        className="shrink-0"
                        style={{ width: connectorWidth }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* 2. MATCH COLUMNS & SVG CONNECTORS ROW */}
            <div className="flex items-start">
              {sortedRoundNumbers.map((roundNum, roundIdx) => {
                const roundMatches = roundsMap.get(roundNum) || [];
                const isLastRound = roundIdx === sortedRoundNumbers.length - 1;

                // Each round spreads its own cards evenly across the tree,
                // so odd-team rounds (fewer or more cards than neighbours)
                // stay aligned with their actual feeder links.
                const currentSlotHeight =
                  totalTreeHeight / Math.max(roundMatches.length, 1);
                const nextRoundMatches = !isLastRound
                  ? roundsMap.get(sortedRoundNumbers[roundIdx + 1]) || []
                  : [];
                const nextSlotHeight =
                  nextRoundMatches.length > 0
                    ? totalTreeHeight / nextRoundMatches.length
                    : currentSlotHeight;
                const centerOf = (idx: number, slotH: number) =>
                  idx * slotH + slotH / 2;

                return (
                  <React.Fragment key={roundNum}>
                    {/* Round Column of Matches */}
                    <div
                      className="flex flex-col w-64 shrink-0"
                      style={{ height: totalTreeHeight }}
                    >
                      {roundMatches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-center"
                          style={{ height: currentSlotHeight }}
                        >
                          <MatchCard
                            match={match}
                            teams={tournament.teams}
                            onOpenScore={onOpenScore}
                            onResetMatch={onResetMatch}
                          />
                        </div>
                      ))}
                    </div>

                    {/* SVG Connector Column between this round and next round.
                        Links follow actual nextMatchId feeders (not positional
                        pairs), so even-team pairings draw forks, odd-team
                        carry-forwards draw single elbows, and one-card rounds
                        draw a straight-through line instead of a broken fork. */}
                    {!isLastRound && (
                      <div
                        className="shrink-0"
                        style={{
                          width: connectorWidth,
                          height: totalTreeHeight,
                        }}
                      >
                        <svg
                          width={connectorWidth}
                          height={totalTreeHeight}
                          className="overflow-visible select-none"
                        >
                          {nextRoundMatches.map((nextMatch, nextIdx) => {
                            const feeders = roundMatches
                              .map((m, idx) => ({ m, idx }))
                              .filter(
                                ({ m }) => m.nextMatchId === nextMatch.id,
                              );
                            const midY = centerOf(nextIdx, nextSlotHeight);

                            if (feeders.length >= 2) {
                              const top = feeders[0];
                              const bottom = feeders[feeders.length - 1];
                              const topY = centerOf(top.idx, currentSlotHeight);
                              const bottomY = centerOf(
                                bottom.idx,
                                currentSlotHeight,
                              );
                              return (
                                <BracketFork
                                  key={nextMatch.id}
                                  width={connectorWidth}
                                  height={totalTreeHeight}
                                  topY={topY}
                                  bottomY={bottomY}
                                  midY={midY}
                                  hasWinnerTop={Boolean(top.m.winnerId)}
                                  hasWinnerBottom={Boolean(bottom.m.winnerId)}
                                />
                              );
                            }
                            if (feeders.length === 1) {
                              const fromY = centerOf(
                                feeders[0].idx,
                                currentSlotHeight,
                              );
                              return (
                                <ElbowConnector
                                  key={nextMatch.id}
                                  width={connectorWidth}
                                  height={totalTreeHeight}
                                  fromY={fromY}
                                  toY={midY}
                                  isActive={Boolean(feeders[0].m.winnerId)}
                                />
                              );
                            }
                            return null;
                          })}
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
