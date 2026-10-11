import React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

interface BracketZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth?: () => void;
}

export const BracketZoomControls: React.FC<BracketZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
}) => {
  const percentage = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-1.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Zoom Out (Ctrl + -)"
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 w-12 text-center tabular-nums select-none">
        {percentage}%
      </span>

      <button
        onClick={onZoomIn}
        disabled={zoom >= 1.5}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Zoom In (Ctrl + +)"
        aria-label="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      <button
        onClick={onResetZoom}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Reset to 100%"
        aria-label="Reset Zoom"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {onFitWidth && (
        <button
          onClick={onFitWidth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fit view"
          aria-label="Fit View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
