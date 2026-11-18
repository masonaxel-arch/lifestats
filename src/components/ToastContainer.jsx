import React from 'react';
import { Undo2, X, CheckCircle2 } from 'lucide-react';

export default function ToastContainer({ toast, onUndo, onDismiss }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto animate-slide-up pointer-events-auto">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3.5 shadow-2xl flex items-center justify-between space-x-3 backdrop-blur-md overflow-hidden relative">
        {/* Undo action toast */}
        {toast.type === 'undo' ? (
          <>
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="text-xl flex-shrink-0">{toast.emoji || '🔥'}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  +1 {toast.statName}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {toast.location ? `Stamped • ${toast.location}` : 'Logged to your stats'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => {
                  onUndo(toast);
                  onDismiss();
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all tap-bounce"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                onClick={onDismiss}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown line at bottom */}
            <div
              className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-400 to-violet-500 transition-all duration-[4500ms] ease-linear"
              style={{ width: '100%' }}
            />
          </>
        ) : (
          /* General info toast */
          <>
            <div className="flex items-center space-x-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-medium text-zinc-200 truncate">{toast.message}</p>
            </div>
            <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300 p-1">
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
