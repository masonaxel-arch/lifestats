import React, { useState } from 'react';
import { Sparkles, User, Database, Check, Copy, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured, getStoredSupabaseConfig, saveSupabaseConfig, SUPABASE_SQL_SCHEMA } from '../lib/supabase';

export default function Header({ userProfile, onUpdateProfile, onShowSetup }) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.displayName || '');
  const [copiedSql, setCopiedSql] = useState(false);

  const config = getStoredSupabaseConfig();
  const [urlInput, setUrlInput] = useState(config.url || '');
  const [keyInput, setKeyInput] = useState(config.key || '');

  const handleSaveName = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateProfile({ ...userProfile, displayName: nameInput.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveSupabaseConfig(urlInput, keyInput);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] px-4 pt-safe pb-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* App Title & Subtitle */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-violet-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
              <span className="text-lg font-black bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">
                LS
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-white">LifeStats</h1>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Your Lifetime Stat Sheet</p>
          </div>
        </div>

        {/* Right side: Supabase status & Profile */}
        <div className="flex items-center space-x-2">
          {/* Supabase status indicator */}
          <button
            onClick={() => setShowConfigModal(true)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              config.isValid
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Supabase Realtime Status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                config.isValid ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] font-mono">
              {config.isValid ? 'Cloud' : 'Local'}
            </span>
          </button>

          {/* User Display Name Chip */}
          <button
            onClick={() => {
              setNameInput(userProfile.displayName || '');
              setIsEditingName(true);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#18181b] border border-[#27272a] hover:border-zinc-700 text-zinc-200 text-xs font-medium tap-bounce"
          >
            <User className="w-3.5 h-3.5 text-violet-400" />
            <span className="max-w-[85px] truncate">{userProfile.displayName || 'You'}</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white mb-1">Set Display Name</h3>
            <p className="text-xs text-zinc-400 mb-4">
              This name appears on friend leaderboards and shared squad stats.
            </p>
            <form onSubmit={handleSaveName} className="space-y-4">
              <input
                type="text"
                maxLength={24}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Mason A., ChipotleKing"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-2 text-xs font-semibold text-zinc-400 bg-zinc-900 rounded-xl hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl font-bold"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Connection Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-md p-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Supabase Cloud Sync</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-500 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              LifeStats is loaded with your Supabase endpoint. When your publishable key is present,
              friend squad leaderboards synchronize in real-time. Otherwise, a seamless local offline
              mock engine is active.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                Save & Reconnect
              </button>
            </form>

            <div className="border-t border-[#27272a] pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-300">
                  Supabase SQL Migration (Rooms & Realtime)
                </span>
                <button
                  onClick={copySql}
                  className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="bg-[#09090b] p-2.5 rounded-lg border border-[#27272a] text-[10px] text-zinc-400 font-mono overflow-x-auto max-h-32">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
