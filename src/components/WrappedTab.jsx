import React, { useState, useRef } from 'react';
import {
  Download,
  Share2,
  Sparkles,
  Receipt,
  Trophy,
  Flame,
  Check,
  RefreshCw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';

export default function WrappedTab({
  stats,
  logs,
  userProfile,
  rooms = [],
  getLocalRoomMembers,
  showToast
}) {
  const [cardType, setCardType] = useState('receipt'); // 'receipt' | 'squad'
  const [selectedRoomCode, setSelectedRoomCode] = useState(rooms[0]?.code || 'CHIP99');
  const [isExporting, setIsExporting] = useState(false);

  const cardRef = useRef(null);

  // Top 5 personal stats sorted by count descending
  const sortedStats = [...stats].sort((a, b) => (b.count || 0) - (a.count || 0));
  const top5Stats = sortedStats.slice(0, 5);
  const totalLifetimeLogs = stats.reduce((acc, curr) => acc + (curr.count || 0), 0);

  // Selected squad members
  const currentRoom = rooms.find((r) => r.code === selectedRoomCode) || rooms[0] || {
    name: 'Chipotle Squad',
    emoji: '🌯',
    code: 'CHIP99'
  };
  const squadMembers = getLocalRoomMembers
    ? getLocalRoomMembers(currentRoom.code).sort((a, b) => (b.count || 0) - (a.count || 0))
    : [];

  const handleExportImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      // Small pause to ensure rendering stability
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#09090b',
        style: {
          borderRadius: '24px'
        }
      });

      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#8b5cf6', '#ffffff']
      });

      // Convert to blob for native Web Share API (iOS Safari / Android)
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `lifestats-${cardType}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'My LifeStats Lifetime Stat Sheet',
            text: 'When I die these are my top 5 stats 💀📊',
            files: [file]
          });
          showToast('Shared successfully!');
          setIsExporting(false);
          return;
        } catch (shareErr) {
          // If user cancelled native share, fallback to normal download
        }
      }

      // Standard browser download fallback
      const link = document.createElement('a');
      link.download = `lifestats-${cardType}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      showToast('Saved high-res image to photos/downloads!');
    } catch (err) {
      console.error('Image export error:', err);
      showToast('Could not save image directly. Try screenshotting the card!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Switcher: Receipt vs Squad */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-2 flex items-center justify-between shadow-xl">
        <button
          onClick={() => setCardType('receipt')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all tap-bounce flex items-center justify-center space-x-1.5 ${
            cardType === 'receipt'
              ? 'bg-zinc-800 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <span>Top 5 Receipt</span>
        </button>

        <button
          onClick={() => setCardType('squad')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all tap-bounce flex items-center justify-center space-x-1.5 ${
            cardType === 'squad'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Squad Podium</span>
        </button>
      </div>

      {/* If Squad card is active, let user switch squad */}
      {cardType === 'squad' && rooms.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {rooms.map((r) => (
            <button
              key={r.code}
              onClick={() => setSelectedRoomCode(r.code)}
              className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedRoomCode === r.code
                  ? 'bg-violet-600 text-white font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {r.emoji} {r.name}
            </button>
          ))}
        </div>
      )}

      {/* CARD PREVIEW CONTAINER (Aesthetic 9:16 frame for Story/TikTok) */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-full max-w-[340px] aspect-[9/16] bg-[#0c0c0e] border border-[#27272a] rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden text-zinc-100 select-none"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* CARD TYPE 1: TOP 5 RECEIPT */}
          {cardType === 'receipt' && (
            <div className="flex flex-col h-full justify-between font-mono relative z-10">
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-zinc-700/80 pb-3">
                <div className="text-[10px] tracking-widest text-emerald-400 uppercase font-bold">
                  ★ AFTERLIFE TRANSIT AUTHORITY ★
                </div>
                <h3 className="text-base font-black tracking-tight text-white mt-0.5">
                  LIFETIME STAT SHEET
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1">
                  SOUL ID: <span className="text-zinc-200 font-bold">{userProfile.displayName || 'LEGEND'}</span>
                </p>
                <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-1 px-2">
                  <span>TERMINAL: EARTH</span>
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Trend Tagline */}
              <div className="py-2 text-center text-[10px] text-zinc-400 italic">
                “When you die, you see your top 5 lifetime stats”
              </div>

              {/* Top 5 Stats Rows */}
              <div className="space-y-2.5 my-auto">
                {top5Stats.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    Log at least 1 stat to see your receipt!
                  </div>
                ) : (
                  top5Stats.map((stat, idx) => {
                    const percent = totalLifetimeLogs > 0
                      ? Math.round((stat.count / totalLifetimeLogs) * 100)
                      : 0;

                    return (
                      <div
                        key={stat.id}
                        className="bg-[#18181b]/90 border border-[#27272a] rounded-xl p-2.5 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-1">
                          <span className="text-xs font-black text-emerald-400 w-4">
                            #{idx + 1}
                          </span>
                          <span className="text-base">{stat.emoji || '🔥'}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {stat.name}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              {percent}% of life actions
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-black text-emerald-400">
                            {stat.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Receipt Summary & Barcode */}
              <div className="border-t border-dashed border-zinc-700/80 pt-2.5 mt-auto text-center space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300 px-1">
                  <span>TOTAL RECORDED:</span>
                  <span className="text-emerald-400 font-mono text-sm">
                    {totalLifetimeLogs.toLocaleString()}
                  </span>
                </div>

                {/* Aesthetic Barcode SVG */}
                <div className="flex justify-center items-center py-1 opacity-80">
                  <svg width="220" height="28" viewBox="0 0 220 28" fill="currentColor" className="text-zinc-300">
                    <rect x="0" y="0" width="3" height="28" />
                    <rect x="6" y="0" width="2" height="28" />
                    <rect x="11" y="0" width="4" height="28" />
                    <rect x="18" y="0" width="1" height="28" />
                    <rect x="22" y="0" width="5" height="28" />
                    <rect x="30" y="0" width="2" height="28" />
                    <rect x="35" y="0" width="3" height="28" />
                    <rect x="42" y="0" width="1" height="28" />
                    <rect x="46" y="0" width="4" height="28" />
                    <rect x="54" y="0" width="3" height="28" />
                    <rect x="60" y="0" width="2" height="28" />
                    <rect x="65" y="0" width="5" height="28" />
                    <rect x="73" y="0" width="1" height="28" />
                    <rect x="77" y="0" width="4" height="28" />
                    <rect x="84" y="0" width="2" height="28" />
                    <rect x="89" y="0" width="3" height="28" />
                    <rect x="95" y="0" width="5" height="28" />
                    <rect x="103" y="0" width="1" height="28" />
                    <rect x="107" y="0" width="3" height="28" />
                    <rect x="113" y="0" width="2" height="28" />
                    <rect x="118" y="0" width="4" height="28" />
                    <rect x="125" y="0" width="3" height="28" />
                    <rect x="131" y="0" width="1" height="28" />
                    <rect x="135" y="0" width="5" height="28" />
                    <rect x="143" y="0" width="2" height="28" />
                    <rect x="148" y="0" width="4" height="28" />
                    <rect x="155" y="0" width="1" height="28" />
                    <rect x="159" y="0" width="3" height="28" />
                    <rect x="165" y="0" width="2" height="28" />
                    <rect x="170" y="0" width="5" height="28" />
                    <rect x="178" y="0" width="2" height="28" />
                    <rect x="183" y="0" width="4" height="28" />
                    <rect x="190" y="0" width="1" height="28" />
                    <rect x="194" y="0" width="3" height="28" />
                    <rect x="200" y="0" width="5" height="28" />
                    <rect x="208" y="0" width="2" height="28" />
                    <rect x="213" y="0" width="4" height="28" />
                  </svg>
                </div>

                {/* Subtle watermark */}
                <div className="text-[9px] text-zinc-600 font-mono tracking-wider">
                  LIFESTATS • YOUR LIFETIME STAT SHEET
                </div>
              </div>
            </div>
          )}

          {/* CARD TYPE 2: SQUAD PODIUM */}
          {cardType === 'squad' && (
            <div className="flex flex-col h-full justify-between relative z-10">
              {/* Header */}
              <div className="text-center border-b border-[#27272a] pb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-violet-500/40 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-violet-500/20 mb-2">
                  {currentRoom.emoji || '🔥'}
                </div>
                <div className="text-[10px] tracking-widest text-violet-400 uppercase font-mono font-bold">
                  SQUAD LEADERBOARD
                </div>
                <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                  {currentRoom.name}
                </h3>
                <div className="inline-block mt-1 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-[10px] font-mono text-violet-300">
                  CODE #{currentRoom.code}
                </div>
              </div>

              {/* Members Rankings */}
              <div className="space-y-2.5 my-auto">
                {squadMembers.slice(0, 5).map((m, idx) => {
                  const is1st = idx === 0;
                  const is2nd = idx === 1;
                  const is3rd = idx === 2;

                  let medal = `#${idx + 1}`;
                  if (is1st) medal = '🥇';
                  if (is2nd) medal = '🥈';
                  if (is3rd) medal = '🥉';

                  return (
                    <div
                      key={m.id || m.user_id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        is1st
                          ? 'bg-amber-950/25 border-amber-500/40 shadow-md shadow-amber-500/10'
                          : 'bg-[#18181b]/80 border-[#27272a]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="text-base flex-shrink-0">{medal}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {m.display_name}
                          </span>
                          {m.last_location && (
                            <span className="text-[9px] text-zinc-500 truncate block">
                              📍 {m.last_location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 font-mono">
                        <span
                          className={`text-base font-black ${
                            is1st ? 'text-amber-400' : 'text-zinc-200'
                          }`}
                        >
                          {m.count || 0}
                        </span>
                        <span className="block text-[8px] text-zinc-500 uppercase">
                          logs
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Squad Footer & Watermark */}
              <div className="border-t border-[#27272a] pt-3 text-center">
                <div className="text-[10px] text-zinc-400 mb-1">
                  Compete live with your friends on LifeStats
                </div>
                <div className="text-[9px] text-zinc-600 font-mono tracking-wider uppercase">
                  LIFESTATS • SQUAD #{currentRoom.code}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button: Save Image for Story / TikTok */}
      <div className="max-w-xs mx-auto">
        <button
          onClick={handleExportImage}
          disabled={isExporting}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-600 text-black font-black text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 disabled:opacity-50 transition-all tap-bounce flex items-center justify-center space-x-2"
        >
          {isExporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>Rendering 9:16 Card...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 stroke-[2.5] text-black" />
              <span>Save Image for Story / TikTok</span>
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-zinc-500 mt-2">
          High-res 9:16 PNG ready for Instagram Stories, TikTok, or group chats
        </p>
      </div>
    </div>
  );
}
