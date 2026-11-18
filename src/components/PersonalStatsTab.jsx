import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Sparkles, RotateCcw, MoreVertical, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRelativeTime } from '../lib/geolocation';

export default function PersonalStatsTab({
  stats,
  onIncrementStat,
  onOpenNewModal,
  onClearSamples,
  onDeleteStat,
  onResetStat
}) {
  const [animatingId, setAnimatingId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const hasSamples = stats.some((s) => s.isSample);
  const totalLifetimeLogs = stats.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const handleIncrement = (stat) => {
    setAnimatingId(stat.id);
    setTimeout(() => setAnimatingId(null), 300);

    // Trigger celebratory burst on notable counts (e.g., multiples of 50 or 100)
    if ((stat.count + 1) % 50 === 0 || stat.count + 1 === 100) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#8b5cf6', '#ffffff']
      });
    }

    onIncrementStat(stat);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner & Quick Stat Summary */}
      <div className="bg-gradient-to-br from-[#18181b] via-[#18181b] to-zinc-900 border border-[#27272a] rounded-2xl p-4 relative overflow-hidden shadow-xl">
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Lifetime Stat Sheet</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {totalLifetimeLogs.toLocaleString()}{' '}
              <span className="text-xs font-medium text-zinc-400 font-sans">
                total actions logged
              </span>
            </h2>
          </div>

          <button
            onClick={onOpenNewModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 hover:opacity-95 tap-bounce"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Stat</span>
          </button>
        </div>

        {/* Clear samples banner if any sample stats exist */}
        {hasSamples && (
          <div className="flex items-center justify-between pt-2.5 border-t border-[#27272a] text-xs text-zinc-400">
            <span className="text-[11px] text-zinc-400">
              ⚡ Showing starter stats from TikTok trend
            </span>
            <button
              onClick={onClearSamples}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2"
            >
              Clear Samples
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards Grid */}
      {stats.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-2xl">
            📊
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No stats tracked yet</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
            Create your first custom life counter: coffees, chipotle bowls, or late night thoughts!
          </p>
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-xl tap-bounce"
          >
            + Create First Stat
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((stat) => {
            const isAnimating = animatingId === stat.id;
            const isMenuOpen = activeMenuId === stat.id;

            return (
              <div
                key={stat.id}
                className="bg-[#18181b] border border-[#27272a] hover:border-zinc-700 rounded-2xl p-4 transition-all duration-200 relative group shadow-lg"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Emoji + Stat Name + Last Logged Info */}
                  <div className="flex items-start space-x-3 min-w-0 pr-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner group-hover:border-zinc-700 transition-colors">
                      {stat.emoji || '🔥'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-extrabold text-sm text-white tracking-tight truncate">
                          {stat.name}
                        </h3>
                        {stat.trackGps && (
                          <span
                            title="GPS location stamping enabled"
                            className="text-emerald-400 flex items-center text-[10px]"
                          >
                            <MapPin className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Last logged status: "Last logged: 2h ago • Madison, WI" */}
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        Last logged: {formatRelativeTime(stat.lastLogged)}
                        {stat.lastLocation ? ` • ${stat.lastLocation}` : ''}
                      </p>

                      {/* Target Progress Bar if stat has target */}
                      {stat.target && (
                        <div className="mt-2 w-32">
                          <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-0.5">
                            <span>{stat.count}/{stat.target}</span>
                            <span>{Math.min(100, Math.round((stat.count / stat.target) * 100))}%</span>
                          </div>
                          <div className="w-full bg-[#09090b] h-1.5 rounded-full overflow-hidden border border-zinc-800">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-violet-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (stat.count / stat.target) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Big Bold Count & Quick Menu */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-right">
                      <span
                        className={`font-mono text-2xl font-black text-white tracking-tight inline-block transition-transform ${
                          isAnimating ? 'scale-125 text-emerald-400' : ''
                        }`}
                      >
                        {stat.count.toLocaleString()}
                      </span>
                    </div>

                    {/* Options 3-dots */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : stat.id)}
                        className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-7 z-20 w-36 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl py-1 text-xs">
                          <button
                            onClick={() => {
                              onResetStat(stat.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 flex items-center space-x-2"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Count</span>
                          </button>
                          <button
                            onClick={() => {
                              onDeleteStat(stat.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-zinc-800 flex items-center space-x-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Stat</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Big Bold +1 Log Button */}
                <div className="mt-3.5 pt-3 border-t border-[#27272a]/60">
                  <button
                    onClick={() => handleIncrement(stat)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500/25 hover:to-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-extrabold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all tap-bounce"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+1 Log {stat.name}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
