import React, { useState } from 'react';
import { MapPin, Sparkles, X, Plus, Target } from 'lucide-react';
import { getCurrentPosition, reverseGeocode } from '../lib/geolocation';

const QUICK_EMOJIS = [
  '🌯', '☕', '🍺', '🍕', '⛳', '🏋️', '⏰', '💭', 
  '❤️', '🎮', '🚗', '✈️', '😴', '📱', '💸', '🍿', 
  '🐶', '🎯', '📚', '🍣', '🍦', '🚿', '🎸', '🏖️'
];

const SUGGESTIONS = [
  'Chipotle Bowls',
  'Times Seen GF',
  'Golf Rounds',
  'Sneezes',
  'Red Bulls Drank',
  'Late Night Thoughts',
  'Gym Sessions',
  'Cold Plunges'
];

export default function NewStatModal({ isOpen, onClose, onAddStat }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌯');
  const [trackGps, setTrackGps] = useState(true);
  const [initialCount, setInitialCount] = useState(0);
  const [target, setTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    let lastLocation = null;
    let lat = null;
    let lng = null;

    if (trackGps && initialCount > 0) {
      const pos = await getCurrentPosition();
      if (pos.success) {
        lat = pos.lat;
        lng = pos.lng;
        lastLocation = await reverseGeocode(lat, lng);
      }
    }

    onAddStat({
      name: name.trim(),
      emoji,
      trackGps,
      initialCount: Number(initialCount) || 0,
      target: target ? Number(target) : null,
      lastLocation,
      lastLat: lat,
      lastLng: lng
    });

    setIsSubmitting(false);
    onClose();
    setName('');
    setTarget('');
    setInitialCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#18181b] border-t sm:border border-[#27272a] rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 pb-safe shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Stat</h2>
              <p className="text-[11px] text-zinc-400">Add any life metric you want to tally</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Emoji Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">
              Select Emoji
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#09090b] border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner">
                {emoji}
              </div>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(-2) || '🔥')}
                className="w-24 bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-center text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Custom"
              />
              <span className="text-[11px] text-zinc-500">Pick below or type custom</span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#09090b] rounded-xl border border-[#27272a]/80 max-h-24 overflow-y-auto">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-zinc-800 transition-transform ${
                    emoji === em ? 'bg-emerald-500/20 scale-110 border border-emerald-500/40' : ''
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Name Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Stat Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={36}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Times Seen GF, Chipotle Bowls..."
              className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTIONS.slice(0, 4).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => setName(sugg)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Counts & Target */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Current Count
              </label>
              <input
                type="number"
                min="0"
                value={initialCount}
                onChange={(e) => setInitialCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Goal / Target <span className="text-zinc-500 text-[10px]">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* GPS Location Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#09090b] border border-[#27272a]">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Capture GPS Location</p>
                <p className="text-[10px] text-zinc-400">Stamp City/State to timeline on every +1</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={trackGps}
                onChange={(e) => setTrackGps(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all tap-bounce flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>{isSubmitting ? 'Creating Stat...' : 'Start Tracking'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
