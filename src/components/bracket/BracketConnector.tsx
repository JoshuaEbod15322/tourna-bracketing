import React from 'react';

interface BracketForkProps {
  width?: number;
  height: number;
  topY: number;
  bottomY: number;
  midY: number;
  className?: string;
  hasWinnerTop?: boolean;
  hasWinnerBottom?: boolean;
}

/**
 * Renders a crisp SVG bracket connector fork joining a match pair into a downstream match.
 */
export const BracketFork: React.FC<BracketForkProps> = ({
  width = 48,
  height,
  topY,
  bottomY,
  midY,
  className = '',
  hasWinnerTop = false,
  hasWinnerBottom = false,
}) => {
  const midX = width / 2;
  const radius = 6; // smooth subtle curved elbow corner

  // Path from top match to vertical spine
  const topPath = `M 0 ${topY} H ${midX - radius} Q ${midX} ${topY} ${midX} ${topY + radius} V ${midY}`;
  // Path from bottom match to vertical spine
  const bottomPath = `M 0 ${bottomY} H ${midX - radius} Q ${midX} ${bottomY} ${midX} ${bottomY - radius} V ${midY}`;
  // Stem to next match
  const stemPath = `M ${midX} ${midY} H ${width}`;

  return (
    <svg
      width={width}
      height={height}
      className={`shrink-0 overflow-visible pointer-events-none select-none ${className}`}
      style={{ minWidth: width }}
    >
      {/* Background connector path */}
      <path
        d={`${topPath} ${bottomPath} ${stemPath}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-300 dark:text-slate-700 transition-colors"
      />

      {/* Active branch highlight if top winner */}
      {hasWinnerTop && (
        <path
          d={`M 0 ${topY} H ${midX - radius} Q ${midX} ${topY} ${midX} ${topY + radius} V ${midY} H ${width}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-emerald-500/80 transition-colors"
        />
      )}

      {/* Active branch highlight if bottom winner */}
      {hasWinnerBottom && (
        <path
          d={`M 0 ${bottomY} H ${midX - radius} Q ${midX} ${bottomY} ${midX} ${bottomY - radius} V ${midY} H ${width}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-emerald-500/80 transition-colors"
        />
      )}
    </svg>
  );
};

/**
 * Elbow connector for a single feeder card advancing into a downstream match.
 * Used when a downstream slot is fed by exactly one visible card (the other
 * side is a bye auto-advance or comes from another bracket section), and for
 * 1-to-1 transitions where card positions differ between rounds (odd-team
 * carry-forward). Falls back to a straight line when both ends align.
 */
export const ElbowConnector: React.FC<{
  width?: number;
  height: number;
  fromY: number;
  toY: number;
  className?: string;
  isActive?: boolean;
}> = ({ width = 48, height, fromY, toY, className = '', isActive = false }) => {
  const midX = width / 2;
  const radius = 6;

  // Straight-through fast path (single-card rounds aligned 1-to-1).
  if (Math.abs(fromY - toY) < 0.5) {
    return (
      <svg
        width={width}
        height={height}
        className={`shrink-0 overflow-visible pointer-events-none select-none ${className}`}
        style={{ minWidth: width }}
      >
        <line
          x1="0"
          y1={toY}
          x2={width}
          y2={toY}
          stroke="currentColor"
          strokeWidth="2"
          className={isActive ? 'text-emerald-500/80' : 'text-slate-300 dark:text-slate-700'}
        />
      </svg>
    );
  }

  const goingDown = toY >= fromY;
  // Horizontal out of the feeder card, vertical spine, horizontal into the target.
  const outPath = goingDown
    ? `M 0 ${fromY} H ${midX - radius} Q ${midX} ${fromY} ${midX} ${fromY + radius} V ${toY} H ${width}`
    : `M 0 ${fromY} H ${midX - radius} Q ${midX} ${fromY} ${midX} ${fromY - radius} V ${toY} H ${width}`;

  return (
    <svg
      width={width}
      height={height}
      className={`shrink-0 overflow-visible pointer-events-none select-none ${className}`}
      style={{ minWidth: width }}
    >
      <path
        d={outPath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-300 dark:text-slate-700 transition-colors"
      />
      {isActive && (
        <path
          d={outPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-emerald-500/80 transition-colors"
        />
      )}
    </svg>
  );
};

interface StraightConnectorProps {
  width?: number;
  height: number;
  y: number;
  className?: string;
  isCompleted?: boolean;
}

/**
 * Straight horizontal connector line for 1-to-1 match transitions.
 */
export const StraightConnector: React.FC<StraightConnectorProps> = ({
  width = 48,
  height,
  y,
  className = '',
  isCompleted = false,
}) => {
  return (
    <svg
      width={width}
      height={height}
      className={`shrink-0 overflow-visible pointer-events-none select-none ${className}`}
      style={{ minWidth: width }}
    >
      <line
        x1="0"
        y1={y}
        x2={width}
        y2={y}
        stroke="currentColor"
        strokeWidth="2"
        className={isCompleted ? 'text-emerald-500/80' : 'text-slate-300 dark:text-slate-700'}
      />
    </svg>
  );
};
