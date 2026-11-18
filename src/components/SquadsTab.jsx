import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Share2,
  Trophy,
  Copy,
  Check,
  MapPin,
  Flame,
  ArrowRight,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getLocalRooms,
  getLocalRoomMembers,
  saveLocalRoomMember
} from '../lib/storage';
import { getCurrentPosition, reverseGeocode, formatRelativeTime } from '../lib/geolocation';

const SQUAD_EMOJIS = ['🌯', '💪', '🍺', '☕', '🍕', '⛳', '🎮', '🚗', '✈️', '😴', '🔥', '📚'];

export default function SquadsTab({ userProfile, onAddTimelineLog, showToast }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoomCode, setActiveRoomCode] = useState('CHIP99');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create Form State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomEmoji, setNewRoomEmoji] = useState('🌯');

  // Join Form State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Load rooms and handle query param ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');

    loadRooms(roomParam);
  }, []);

  // Subscribe to room members when activeRoomCode changes
  useEffect(() => {
    if (!activeRoomCode) return;
    loadMembers(activeRoomCode);

    let channel = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`room-leaderboard-${activeRoomCode}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_members',
            filter: `room_code=eq.${activeRoomCode}`
          },
          (payload) => {
            console.log('Realtime member change:', payload);
            loadMembers(activeRoomCode);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeRoomCode]);

  const loadRooms = async (preferredCode) => {
    setLoading(true);
    let loadedRooms = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          loadedRooms = data;
        }
      } catch (err) {
        console.warn('Error fetching rooms from Supabase:', err);
      }
    }

    // Fallback to local rooms if no cloud rooms or offline
    if (loadedRooms.length === 0) {
      loadedRooms = getLocalRooms();
    }

    setRooms(loadedRooms);

    // Set active room
    if (preferredCode) {
      const match = loadedRooms.find((r) => r.code.toUpperCase() === preferredCode.toUpperCase());
      if (match) {
        setActiveRoomCode(match.code);
      } else {
        // Auto-join preference code
        autoJoinCode(preferredCode.toUpperCase());
      }
    } else if (loadedRooms.length > 0) {
      setActiveRoomCode((prev) => (prev ? prev : loadedRooms[0].code));
    }
    setLoading(false);
  };

  const autoJoinCode = async (code) => {
    // Check if room exists in Supabase
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('rooms').select('*').eq('code', code).single();
      if (data) {
        await joinRoomByCode(code);
        return;
      }
    }
    setActiveRoomCode(code);
  };

  const loadMembers = async (roomCode) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('room_members')
          .select('*')
          .eq('room_code', roomCode)
          .order('count', { ascending: false });

        if (!error && data) {
          setMembers(data);
          return;
        }
      } catch (err) {
        console.warn('Supabase members fetch error:', err);
      }
    }

    // Local fallback
    const local = getLocalRoomMembers(roomCode);
    const sorted = [...local].sort((a, b) => (b.count || 0) - (a.count || 0));
    setMembers(sorted);
  };

  // CREATE ROOM
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    // Generate unique 6-character room code (e.g. "BURR42")
    const generatedCode = (
      newRoomName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'SQUAD'
    ).padEnd(4, 'X') + Math.floor(10 + Math.random() * 90);

    const roomPayload = {
      code: generatedCode,
      name: newRoomName.trim(),
      emoji: newRoomEmoji || '🔥',
      created_by: userProfile.displayName || 'You',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: roomErr } = await supabase.from('rooms').insert([roomPayload]);
        if (roomErr) throw roomErr;

        // Add creator as first member
        const memberPayload = {
          room_code: generatedCode,
          user_id: userProfile.id,
          display_name: userProfile.displayName || 'Creator',
          count: 0,
          last_logged_at: new Date().toISOString(),
          last_location: 'Joined',
          updated_at: new Date().toISOString()
        };
        await supabase.from('room_members').insert([memberPayload]);
      } catch (err) {
        console.error('Supabase room create failed, using local:', err);
      }
    }

    // Local storage fallback
    const updatedRooms = [roomPayload, ...rooms];
    setRooms(updatedRooms);
    setActiveRoomCode(generatedCode);

    saveLocalRoomMember(generatedCode, {
      id: 'mem_' + Date.now(),
      room_code: generatedCode,
      user_id: userProfile.id,
      display_name: userProfile.displayName || 'Creator',
      count: 0,
      last_logged_at: new Date().toISOString(),
      last_location: 'Joined'
    });

    setShowCreateModal(false);
    setNewRoomName('');
    showToast(`Created squad "${roomPayload.name}"! Code: ${generatedCode}`);
    loadMembers(generatedCode);
  };

  // JOIN ROOM
  const joinRoomByCode = async (codeToJoin) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) return;

    let targetRoom = rooms.find((r) => r.code === code);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('rooms').select('*').eq('code', code).single();
        if (data) {
          targetRoom = data;
          if (!rooms.some((r) => r.code === code)) {
            setRooms([data, ...rooms]);
          }

          // Check if user is already a member
          const { data: existingMember } = await supabase
            .from('room_members')
            .select('*')
            .eq('room_code', code)
            .eq('user_id', userProfile.id)
            .single();

          if (!existingMember) {
            await supabase.from('room_members').insert([
              {
                room_code: code,
                user_id: userProfile.id,
                display_name: userProfile.displayName || 'Friend',
                count: 0,
                last_logged_at: new Date().toISOString(),
                last_location: 'Joined'
              }
            ]);
          }
        }
      } catch (err) {
        console.warn('Error joining in Supabase:', err);
      }
    }

    // Local member fallback
    saveLocalRoomMember(code, {
      id: 'mem_' + Date.now(),
      room_code: code,
      user_id: userProfile.id,
      display_name: userProfile.displayName || 'Friend',
      count: 0,
      last_logged_at: new Date().toISOString(),
      last_location: 'Joined'
    });

    setActiveRoomCode(code);
    setShowJoinModal(false);
    setJoinCodeInput('');
    showToast(`Joined squad ${code}!`);
    loadMembers(code);
  };

  // LOG +1 TO SQUAD TRACKER
  const handleLogMine = async () => {
    const activeRoom = rooms.find((r) => r.code === activeRoomCode) || {
      name: 'Squad Tracker',
      emoji: '🔥'
    };

    // Fast optimistic UI update
    let userLocation = 'Current Location';
    let lat = null;
    let lng = null;

    const pos = await getCurrentPosition();
    if (pos.success) {
      lat = pos.lat;
      lng = pos.lng;
      userLocation = await reverseGeocode(lat, lng);
    }

    const currentMember = members.find((m) => m.user_id === userProfile.id);
    const newCount = (currentMember?.count || 0) + 1;

    // Confetti celebration
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#10b981', '#fbbf24']
    });

    // Supabase update
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('room_members').upsert(
          {
            room_code: activeRoomCode,
            user_id: userProfile.id,
            display_name: userProfile.displayName || 'You',
            count: newCount,
            last_logged_at: new Date().toISOString(),
            last_location: userLocation,
            last_lat: lat,
            last_lng: lng,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'room_code,user_id' }
        );

        if (error) throw error;
      } catch (err) {
        console.warn('Supabase log error, saving locally:', err);
      }
    }

    // Local save
    saveLocalRoomMember(activeRoomCode, {
      id: currentMember?.id || 'mem_' + Date.now(),
      room_code: activeRoomCode,
      user_id: userProfile.id,
      display_name: userProfile.displayName || 'You',
      count: newCount,
      last_logged_at: new Date().toISOString(),
      last_location: userLocation,
      last_lat: lat,
      last_lng: lng
    });

    // Personal timeline entry
    onAddTimelineLog({
      type: 'squad',
      roomCode: activeRoomCode,
      statName: activeRoom.name,
      emoji: activeRoom.emoji,
      locationName: userLocation,
      lat,
      lng,
      note: `Logged in ${activeRoom.name} squad`
    });

    showToast(`Logged +1 for ${activeRoom.name}! You have ${newCount}`);
    loadMembers(activeRoomCode);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${activeRoomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast(`Squad invite link copied! (?room=${activeRoomCode})`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const activeRoom = rooms.find((r) => r.code === activeRoomCode) || rooms[0] || {
    name: 'Friend Squad',
    emoji: '🔥',
    code: activeRoomCode
  };

  const currentMember = members.find((m) => m.user_id === userProfile.id);
  const userRankIndex = members.findIndex((m) => m.user_id === userProfile.id);

  return (
    <div className="space-y-4 pb-24">
      {/* Squad Header & Room Selector Pills */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users2 className="w-5 h-5 text-violet-400" />
            <h2 className="font-extrabold text-base text-white">Friend Squads</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium tap-bounce"
            >
              Join Code
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-md shadow-violet-600/30 tap-bounce"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Room Switcher Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {rooms.map((room) => {
            const isActive = room.code === activeRoomCode;
            return (
              <button
                key={room.code}
                onClick={() => setActiveRoomCode(room.code)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all tap-bounce ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-[#09090b] text-zinc-400 hover:text-zinc-200 border border-[#27272a]'
                }`}
              >
                <span>{room.emoji || '🔥'}</span>
                <span>{room.name}</span>
                <span className="text-[10px] font-mono opacity-60">#{room.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Squad Card & Action Banner */}
      <div className="bg-gradient-to-br from-[#18181b] via-[#18181b] to-zinc-900 border border-[#27272a] rounded-2xl p-4 relative overflow-hidden shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#09090b] border border-violet-500/30 flex items-center justify-center text-3xl shadow-inner">
              {activeRoom.emoji || '🔥'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-lg text-white">{activeRoom.name}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
                  {activeRoomCode}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {members.length} {members.length === 1 ? 'member' : 'members'} competing live
              </p>
            </div>
          </div>

          {/* Copy Invite Link */}
          <button
            onClick={copyInviteLink}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-[#27272a] hover:border-violet-500 text-xs font-semibold text-zinc-300 hover:text-white tap-bounce"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
            )}
            <span>{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>
        </div>

        {/* Big "+1 Log Mine" Squad Button */}
        <div className="mt-4 pt-3 border-t border-[#27272a]">
          <button
            onClick={handleLogMine}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-violet-600/30 hover:opacity-95 tap-bounce flex items-center justify-center space-x-2"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>+1 Log Mine in {activeRoom.name}</span>
          </button>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-400">
            <span>
              Your count: <strong className="text-white font-mono">{currentMember?.count || 0}</strong>
            </span>
            <span>
              Rank:{' '}
              <strong className="text-emerald-400 font-mono">
                {userRankIndex >= 0 ? `#${userRankIndex + 1}` : 'Not ranked yet'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Live Leaderboard List */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">Live Leaderboard</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
            Realtime
          </span>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500">
            No members logged in this squad yet. Be the first to hit +1!
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member, idx) => {
              const isCurrentUser = member.user_id === userProfile.id;
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              let rankBadge = (
                <span className="text-xs font-mono font-bold text-zinc-500 w-6 text-center">
                  #{idx + 1}
                </span>
              );

              if (isFirst) {
                rankBadge = (
                  <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-sm shadow-sm shadow-amber-400/40">
                    🥇
                  </div>
                );
              } else if (isSecond) {
                rankBadge = (
                  <div className="w-6 h-6 rounded-full bg-zinc-300/20 border border-zinc-300/50 flex items-center justify-center text-sm">
                    🥈
                  </div>
                );
              } else if (isThird) {
                rankBadge = (
                  <div className="w-6 h-6 rounded-full bg-amber-700/20 border border-amber-700/50 flex items-center justify-center text-sm">
                    🥉
                  </div>
                );
              }

              return (
                <div
                  key={member.id || member.user_id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    isCurrentUser
                      ? 'bg-violet-950/25 border border-violet-500/40'
                      : 'bg-[#09090b] border border-[#27272a]/70 hover:border-zinc-700'
                  }`}
                >
                  {/* Left: Rank + Avatar / Name + Location */}
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="flex-shrink-0">{rankBadge}</div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-white truncate">
                          {member.display_name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5 truncate">
                        <span>{formatRelativeTime(member.last_logged_at)}</span>
                        {member.last_location && (
                          <span className="flex items-center space-x-0.5 text-zinc-400">
                            <span>•</span>
                            <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                            <span className="truncate">{member.last_location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Big Member Count */}
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="font-mono text-xl font-black text-white">
                      {member.count || 0}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-zinc-500">
                      logs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE JOINT TRACKER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-[#18181b] border-t sm:border border-[#27272a] rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Joint Tracker</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Spin up a live leaderboard for your group chat, dorm, or club.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Topic / Squad Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Semester Chipotle Bowls"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">
                  Pick Squad Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {SQUAD_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewRoomEmoji(em)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                        newRoomEmoji === em
                          ? 'bg-violet-600/30 border border-violet-500 scale-105'
                          : 'bg-[#09090b] border border-[#27272a]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-zinc-400 bg-zinc-900 rounded-xl hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoomName.trim()}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 disabled:opacity-50"
                >
                  Generate Squad & Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN TRACKER MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-[#18181b] border-t sm:border border-[#27272a] rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 pb-safe shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Join Friend Tracker</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter the 6-character room code from your friend's invite.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                joinRoomByCode(joinCodeInput);
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CHIP99"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-3 text-center text-lg font-mono tracking-widest text-white uppercase focus:outline-none focus:border-violet-500"
                  autoFocus
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-zinc-400 bg-zinc-900 rounded-xl hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 disabled:opacity-50"
                >
                  Join Leaderboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
