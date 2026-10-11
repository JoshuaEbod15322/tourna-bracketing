import React, { useState } from 'react';
import { Match, Tournament } from '../../types/tournament';
import { MatchCard } from './MatchCard';
import { ChampionBanner } from './ChampionBanner';
import { BracketZoomControls } from './BracketZoomControls';
import { BracketFork, StraightConnector } from './BracketConnector';
import { getNextPowerOfTwo } from '../../services/seedGenerator';

interface DoubleEliminationBracketProps {
  tournament: Tournament;
  onOpenScore: (match: Match) => void;
  onResetMatch: (matchId: string) => void;
}

export const DoubleEliminationBracket: React.FC<DoubleEliminationBracketProps> = ({
  tournament,
  onOpenScore,
  onResetMatch,
}) => {
  const [zoom, setZoom] = useState(1);

  const wbMatches = tournament.matches.filter(m => m.bracketType === 'winners');
  const lbMatches = tournament.matches.filter(m => m.bracketType === 'losers');
  const gfMatch1 = tournament.matches.find(m => m.bracketType === 'grand_final') || null;

  // Group WB matches
  const wbRounds = new Map<number, Match[]>();
  wbMatches.forEach(m => {
    const list = wbRounds.get(m.roundNumber) || [];
    list.push(m);
    wbRounds.set(m.roundNumber, list);
  });
  const sortedWbRounds = Array.from(wbRounds.keys()).sort((a, b) => a - b);

  // Group LB matches
  const lbRounds = new Map<number, Match[]>();
  lbMatches.forEach(m => {
    const list = lbRounds.get(m.roundNumber) || [];
    list.push(m);
    lbRounds.set(m.roundNumber, list);
  });
  const sortedLbRounds = Array.from(lbRounds.keys()).sort((a, b) => a - b);

  const championTeam = tournament.championTeamId
    ? tournament.teams.find(t => t.id === tournament.championTeamId) || null
    : null;

  const runnerUpTeam = tournament.runnerUpTeamId
    ? tournament.teams.find(t => t.id === tournament.runnerUpTeamId) || null
    : null;

  // Geometry calculations
  const baseSlotHeight = 160;
  const cardWidth = 256;
  const connectorWidth = 56;
  const colStep = cardWidth + connectorWidth; // 312px

  const N = tournament.teams.length;
  const S = getNextPowerOfTwo(N, 4);
  const W = Math.log2(S); // Number of WB rounds

  // Height of Upper Bracket match tree
  const wbR1Count = wbRounds.get(1)?.length || S / 2;
  const wbTotalHeight = Math.max(wbR1Count * baseSlotHeight, 320);

  // Height of Lower Bracket match tree
  const lbR1Count = lbRounds.get(1)?.length || S / 4;
  const lbTotalHeight = Math.max(lbR1Count * baseSlotHeight, 320);

  // Exact vertical anchor coordinates
  // 1. Upper Bracket
  const headerHeight = 48; // Section title (h-8 mb-4 = 32+16)
  const wbMatchesTop = headerHeight; // No column headers row on upper bracket! Exactly headerHeight (48px)
  const wbFinalRoundIdx = sortedWbRounds.length - 1;
  const wbFinalMatch = wbRounds.get(sortedWbRounds[wbFinalRoundIdx])?.[0];

  const yWbCenter = wbMatchesTop + wbTotalHeight / 2;
  const xWbRight = wbFinalRoundIdx * colStep + cardWidth;

  // 2. Lower Bracket
  const interBracketGap = 80;
  const lbSectionTop = wbMatchesTop + wbTotalHeight + interBracketGap;
  const lbMatchesTop = lbSectionTop + headerHeight; // No column headers row on lower bracket! Exactly headerHeight (48px)
  const lbFinalRoundIdx = sortedLbRounds.length - 1;
  const lbFinalMatch = lbRounds.get(sortedLbRounds[lbFinalRoundIdx])?.[0];

  const yLbCenter = lbMatchesTop + lbTotalHeight / 2;
  const xLbRight = lbFinalRoundIdx * colStep + cardWidth;

  // 3. Grand Finals Column (placed to the right of Lower Final)
  const gfColIdx = Math.max(sortedLbRounds.length, sortedWbRounds.length);
  const xGf = gfColIdx * colStep;
  const yGfCenter = (yWbCenter + yLbCenter) / 2;
  const yGfTop = yGfCenter - 64; // 128px card exactly centered at yGfCenter

  // Total canvas boundaries (no reset card)
  const totalBoardWidth = xGf + cardWidth + 64;
  const totalBoardHeight = lbMatchesTop + lbTotalHeight + 64;

  // SVG Bridge paths connecting Upper Final and Lower Final into Grand Finals
  const spineX = xGf - 28;
  const cornerRadius = 8;

  const upperBridgePath = `M ${xWbRight} ${yWbCenter} H ${spineX - cornerRadius} Q ${spineX} ${yWbCenter} ${spineX} ${yWbCenter + cornerRadius} V ${yGfCenter - cornerRadius} Q ${spineX} ${yGfCenter} ${spineX + cornerRadius} ${yGfCenter} H ${xGf}`;

  const lowerBridgePath = `M ${xLbRight} ${yLbCenter} H ${spineX - cornerRadius} Q ${spineX} ${yLbCenter} ${spineX} ${yLbCenter - cornerRadius} V ${yGfCenter + cornerRadius} Q ${spineX} ${yGfCenter} ${spineX + cornerRadius} ${yGfCenter} H ${xGf}`;

  const hasWbWinner = Boolean(wbFinalMatch?.winnerId);
  const hasLbWinner = Boolean(lbFinalMatch?.winnerId);

  return (
    <div className="space-y-6">
      {championTeam && (
        <ChampionBanner
          tournament={tournament}
          champion={championTeam}
          runnerUp={runnerUpTeam}
        />
      )}

      {/* Full-page unified bracket board (no enclosing card) */}
      <div>
        {/* Toolbar */}
        <div className="flex items-center justify-between py-3 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Double Elimination Board
            </span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900/40">
                Upper: {wbMatches.length} Matches
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-900/40">
                Lower: {lbMatches.length} Matches
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900/40">
                Grand Final
              </span>
            </div>
          </div>

          {/* Zoom Controls */}
          <BracketZoomControls
            zoom={zoom}
            onZoomIn={() => setZoom(prev => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}
            onZoomOut={() => setZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
            onResetZoom={() => setZoom(1)}
          />
        </div>

        {/* Full-page scrollable & zoomable bracket viewport */}
        <div className="no-scrollbar overflow-auto py-2 relative">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: totalBoardWidth,
              height: totalBoardHeight,
              position: 'relative',
            }}
            className="transition-transform duration-100 ease-out select-none"
          >
            {/* ========================================================================= */}
            {/* 1. UPPER BRACKET (TOP) */}
            {/* ========================================================================= */}
            <div
              className="absolute left-0 top-0"
              style={{ width: (sortedWbRounds.length - 1) * colStep + cardWidth }}
            >
              {/* Upper Bracket Section Label - Just Transparent Text */}
              <div className="h-8 flex items-center mb-4 select-none">
                <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400/40 dark:text-slate-500/40 font-mono">
                  Upper Bracket
                </span>
              </div>

              {/* Upper Bracket Match Columns & Internal SVG Connectors */}
              <div className="flex items-start">
                {sortedWbRounds.map((roundNum, roundIdx) => {
                  const roundMatches = wbRounds.get(roundNum) || [];
                  const isLastRound = roundIdx === sortedWbRounds.length - 1;

                  const currentSlotHeight = Math.pow(2, roundIdx) * baseSlotHeight;
                  const nextRoundMatches = !isLastRound ? wbRounds.get(roundNum + 1) || [] : [];

                  return (
                    <React.Fragment key={roundNum}>
                      {/* Column of Matches */}
                      <div
                        className="flex flex-col w-64 shrink-0"
                        style={{ height: wbTotalHeight }}
                      >
                        {roundMatches.map(match => (
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

                      {/* SVG Connector Column between WB rounds */}
                      {!isLastRound && (
                        <div
                          className="shrink-0"
                          style={{ width: connectorWidth, height: wbTotalHeight }}
                        >
                          <svg
                            width={connectorWidth}
                            height={wbTotalHeight}
                            className="overflow-visible select-none"
                          >
                            {Array.from({ length: nextRoundMatches.length }).map((_, pairIdx) => {
                              const pairSlotHeight = currentSlotHeight * 2;
                              const topY = pairIdx * pairSlotHeight + currentSlotHeight / 2;
                              const bottomY = topY + currentSlotHeight;
                              const midY = (topY + bottomY) / 2;

                              const topMatch = roundMatches[pairIdx * 2];
                              const bottomMatch = roundMatches[pairIdx * 2 + 1];

                              const hasWinnerTop = Boolean(topMatch?.winnerId);
                              const hasWinnerBottom = Boolean(bottomMatch?.winnerId);

                              return (
                                <BracketFork
                                  key={pairIdx}
                                  width={connectorWidth}
                                  height={wbTotalHeight}
                                  topY={topY}
                                  bottomY={bottomY}
                                  midY={midY}
                                  hasWinnerTop={hasWinnerTop}
                                  hasWinnerBottom={hasWinnerBottom}
                                />
                              );
                            })}
                          </svg>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. LOWER BRACKET (BOTTOM) */}
            {/* ========================================================================= */}
            <div
              className="absolute left-0"
              style={{
                top: lbSectionTop,
                width: (sortedLbRounds.length - 1) * colStep + cardWidth,
              }}
            >
              {/* Lower Bracket Section Label - Just Transparent Text */}
              <div className="h-8 flex items-center mb-4 select-none">
                <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400/40 dark:text-slate-500/40 font-mono">
                  Lower Bracket
                </span>
              </div>

              {/* Lower Bracket Match Columns & Internal SVG Connectors */}
              <div className="flex items-start">
                {sortedLbRounds.map((roundNum, roundIdx) => {
                  const roundMatches = lbRounds.get(roundNum) || [];
                  const isLastRound = roundIdx === sortedLbRounds.length - 1;
                  const nextRoundMatches = !isLastRound ? lbRounds.get(roundNum + 1) || [] : [];

                  const currentMatchesCount = roundMatches.length;
                  const nextMatchesCount = nextRoundMatches.length;
                  const currentSlotHeight = lbTotalHeight / currentMatchesCount;
                  const nextSlotHeight = nextMatchesCount > 0 ? lbTotalHeight / nextMatchesCount : currentSlotHeight;

                  const isConvergence = currentMatchesCount > nextMatchesCount;

                  return (
                    <React.Fragment key={roundNum}>
                      {/* Column of Matches */}
                      <div
                        className="flex flex-col w-64 shrink-0"
                        style={{ height: lbTotalHeight }}
                      >
                        {roundMatches.map(match => (
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

                      {/* SVG Connector Column centered to card centers */}
                      {!isLastRound && (
                        <div
                          className="shrink-0"
                          style={{ width: connectorWidth, height: lbTotalHeight }}
                        >
                          <svg
                            width={connectorWidth}
                            height={lbTotalHeight}
                            className="overflow-visible select-none"
                          >
                            {isConvergence ? (
                              // 2-to-1 convergence fork
                              Array.from({ length: nextMatchesCount }).map((_, pairIdx) => {
                                const topY = (pairIdx * 2) * currentSlotHeight + currentSlotHeight / 2;
                                const bottomY = (pairIdx * 2 + 1) * currentSlotHeight + currentSlotHeight / 2;
                                const midY = pairIdx * nextSlotHeight + nextSlotHeight / 2;

                                const topM = roundMatches[pairIdx * 2];
                                const botM = roundMatches[pairIdx * 2 + 1];

                                return (
                                  <BracketFork
                                    key={pairIdx}
                                    width={connectorWidth}
                                    height={lbTotalHeight}
                                    topY={topY}
                                    bottomY={bottomY}
                                    midY={midY}
                                    hasWinnerTop={Boolean(topM?.winnerId)}
                                    hasWinnerBottom={Boolean(botM?.winnerId)}
                                  />
                                );
                              })
                            ) : (
                              // 1-to-1 transition straight horizontal line
                              roundMatches.map((m, idx) => {
                                const y = idx * currentSlotHeight + currentSlotHeight / 2;
                                return (
                                  <StraightConnector
                                    key={idx}
                                    width={connectorWidth}
                                    height={lbTotalHeight}
                                    y={y}
                                    isCompleted={Boolean(m.winnerId)}
                                  />
                                );
                              })
                            )}
                          </svg>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. GRAND FINALS (CONNECTED ON THE RIGHT) */}
            {/* ========================================================================= */}
            {/* Grand Final Match Card (Exact Centering with Left Connector) */}
            {gfMatch1 && (
              <div
                className="absolute w-64 h-[128px]"
                style={{ left: xGf, top: yGfTop }}
              >
                <MatchCard
                  match={gfMatch1}
                  teams={tournament.teams}
                  onOpenScore={onOpenScore}
                  onResetMatch={onResetMatch}
                />
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. OVERARCHING SVG CONNECTOR BRIDGING UPPER & LOWER FINALS TO GRAND FINALS */}
            {/* ========================================================================= */}
            <svg
              width={totalBoardWidth}
              height={totalBoardHeight}
              className="absolute inset-0 pointer-events-none select-none overflow-visible"
            >
              {/* Upper Final to Grand Final line */}
              <path
                d={upperBridgePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-300 dark:text-slate-700 transition-colors"
              />
              {hasWbWinner && (
                <path
                  d={upperBridgePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-emerald-500/80 transition-colors"
                />
              )}

              {/* Lower Final to Grand Final line */}
              <path
                d={lowerBridgePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-300 dark:text-slate-700 transition-colors"
              />
              {hasLbWinner && (
                <path
                  d={lowerBridgePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-emerald-500/80 transition-colors"
                />
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
