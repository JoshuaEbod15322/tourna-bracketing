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
