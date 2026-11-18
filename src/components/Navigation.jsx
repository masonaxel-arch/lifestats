import React from 'react';
import { BarChart3, Users2, MapPin, Sparkles } from 'lucide-react';

const TABS = [
  { id: 'stats', label: 'My Stats', icon: BarChart3 },
  { id: 'squads', label: 'Squads', icon: Users2 },
  { id: 'map', label: 'Log & Map', icon: MapPin },
  { id: 'wrapped', label: 'Wrapped', icon: Sparkles }
];

export default function Navigation({ activeTab, onSelectTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-lg border-t border-[#27272a] pb-safe pt-1.5 px-3">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 relative transition-all duration-200 tap-bounce ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {/* Active neon highlight indicator on top */}
              {isActive && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-violet-500 shadow-sm shadow-emerald-400/50" />
              )}

              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-zinc-800/80 scale-105' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-emerald-400 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                  isActive ? 'font-bold text-zinc-100' : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
