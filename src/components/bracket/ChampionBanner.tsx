import React from "react";
import { Trophy, Award, Sparkles } from "lucide-react";
import { Team, Tournament } from "../../types/tournament";

interface ChampionBannerProps {
  tournament: Tournament;
  champion: Team | null;
  runnerUp: Team | null;
}

export const ChampionBanner: React.FC<ChampionBannerProps> = ({
  tournament,
  champion,
  runnerUp,
}) => {
  if (!champion) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 dark:from-amber-500/5 dark:via-amber-500/15 dark:to-amber-500/5 border border-amber-500/30 rounded-2xl p-6 mb-6 shadow-lg shadow-amber-500/5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <span>Tournament Champion</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {champion.name}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Crown winner in {tournament.name} ({tournament.gameOrSport})
            </p>
          </div>
        </div>

        {runnerUp && (
          <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <Award className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Runner-Up
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {runnerUp.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
