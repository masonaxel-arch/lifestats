// LocalStorage helper for offline personal stats, logs, user profile, and sample data

const KEYS = {
  PERSONAL_STATS: 'lifestats_personal_stats',
  TIMELINE_LOGS: 'lifestats_timeline_logs',
  USER_PROFILE: 'lifestats_user_profile',
  INITIALIZED: 'lifestats_initialized_v1',
  LOCAL_ROOMS: 'lifestats_local_rooms',
  LOCAL_MEMBERS: 'lifestats_local_members',
  ACTIVE_ROOM: 'lifestats_active_room'
};

// Default 4 fun relatable sample stats
export const DEFAULT_SAMPLE_STATS = [
  {
    id: 'sample-1',
    name: 'Chipotle Bowls',
    emoji: '🌯',
    count: 42,
    trackGps: true,
    lastLogged: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastLocation: 'Madison, WI',
    lastLat: 43.0731,
    lastLng: -89.4012,
    isSample: true,
    target: 100
  },
  {
    id: 'sample-2',
    name: 'Times Snoozed Alarm',
    emoji: '⏰',
    count: 187,
    trackGps: false,
    lastLogged: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    lastLocation: 'Bedroom',
    lastLat: null,
    lastLng: null,
    isSample: true,
    target: 200
  },
  {
    id: 'sample-3',
    name: 'Late Night Overthinking',
    emoji: '💭',
    count: 64,
    trackGps: false,
    lastLogged: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    lastLocation: 'Deep Thoughts Zone',
    lastLat: null,
    lastLng: null,
    isSample: true
  },
  {
    id: 'sample-4',
    name: 'Iced Oat Lattes',
    emoji: '☕',
    count: 119,
    trackGps: true,
    lastLogged: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    lastLocation: 'Madison, WI',
    lastLat: 43.0747,
    lastLng: -89.3842,
    isSample: true,
    target: 150
  }
];

// Sample timeline logs for first launch
export const DEFAULT_SAMPLE_LOGS = [
  {
    id: 'log-sample-1',
    type: 'personal',
    statId: 'sample-1',
    statName: 'Chipotle Bowls',
    emoji: '🌯',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    locationName: 'Madison, WI',
    lat: 43.0731,
    lng: -89.4012,
    note: 'Double chicken + guac bowl'
  },
  {
    id: 'log-sample-2',
    type: 'personal',
    statId: 'sample-4',
    statName: 'Iced Oat Lattes',
    emoji: '☕',
    timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    locationName: 'Madison, WI',
    lat: 43.0747,
    lng: -89.3842,
    note: 'Extra espresso shot'
  },
  {
    id: 'log-sample-3',
    type: 'personal',
    statId: 'sample-2',
    statName: 'Times Snoozed Alarm',
    emoji: '⏰',
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    locationName: 'Madison, WI',
    lat: 43.0722,
    lng: -89.4008,
    note: 'Just 5 more minutes...'
  },
  {
    id: 'log-sample-4',
    type: 'personal',
    statId: 'sample-3',
    statName: 'Late Night Overthinking',
    emoji: '💭',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    locationName: 'Madison, WI',
    lat: 43.075,
    lng: -89.402,
    note: 'Why did I say that in 2018?'
  }
];

// Initialize sample data if not already done
export const initLocalStorage = () => {
  if (!localStorage.getItem(KEYS.INITIALIZED)) {
    localStorage.setItem(KEYS.PERSONAL_STATS, JSON.stringify(DEFAULT_SAMPLE_STATS));
    localStorage.setItem(KEYS.TIMELINE_LOGS, JSON.stringify(DEFAULT_SAMPLE_LOGS));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  }

  // Ensure user profile
  if (!localStorage.getItem(KEYS.USER_PROFILE)) {
    const randomId = 'usr_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(
      KEYS.USER_PROFILE,
      JSON.stringify({
        id: randomId,
        displayName: 'StatTracker' + Math.floor(100 + Math.random() * 900)
      })
    );
  }
};

// USER PROFILE
export const getUserProfile = () => {
  try {
    const data = localStorage.getItem(KEYS.USER_PROFILE);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  const randomId = 'usr_' + Math.random().toString(36).substring(2, 9);
  const profile = { id: randomId, displayName: 'StatMaster' + Math.floor(100 + Math.random() * 900) };
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  return profile;
};

export const saveUserProfile = (profile) => {
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
};

// PERSONAL STATS
export const getPersonalStats = () => {
  try {
    const data = localStorage.getItem(KEYS.PERSONAL_STATS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [];
};

export const savePersonalStats = (stats) => {
  localStorage.setItem(KEYS.PERSONAL_STATS, JSON.stringify(stats));
};

export const addPersonalStat = (stat) => {
  const stats = getPersonalStats();
  const newStat = {
    id: 'stat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: stat.name.trim(),
    emoji: stat.emoji || '🔥',
    count: Number(stat.initialCount) || 0,
    trackGps: Boolean(stat.trackGps),
    lastLogged: stat.initialCount > 0 ? new Date().toISOString() : null,
    lastLocation: stat.initialCount > 0 ? (stat.lastLocation || 'Here') : null,
    lastLat: stat.lastLat || null,
    lastLng: stat.lastLng || null,
    target: stat.target ? Number(stat.target) : null,
    isSample: false,
    createdAt: new Date().toISOString()
  };
  const updated = [newStat, ...stats];
  savePersonalStats(updated);
  return newStat;
};

export const clearSampleStats = () => {
  const stats = getPersonalStats();
  const nonSamples = stats.filter((s) => !s.isSample);
  savePersonalStats(nonSamples);
  return nonSamples;
};

export const deletePersonalStat = (id) => {
  const stats = getPersonalStats();
  const updated = stats.filter((s) => s.id !== id);
  savePersonalStats(updated);
  return updated;
};

// TIMELINE LOGS
export const getTimelineLogs = () => {
  try {
    const data = localStorage.getItem(KEYS.TIMELINE_LOGS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [];
};

export const saveTimelineLogs = (logs) => {
  localStorage.setItem(KEYS.TIMELINE_LOGS, JSON.stringify(logs));
};

export const addTimelineLog = (logEntry) => {
  const logs = getTimelineLogs();
  const newLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    ...logEntry
  };
  const updated = [newLog, ...logs];
  // Keep max 500 logs to avoid localStorage bloat
  const trimmed = updated.slice(0, 500);
  saveTimelineLogs(trimmed);
  return newLog;
};

export const removeTimelineLog = (logId) => {
  const logs = getTimelineLogs();
  const updated = logs.filter((l) => l.id !== logId);
  saveTimelineLogs(updated);
  return updated;
};

// INCREMENT & UNDO HELPER
export const incrementPersonalStat = (statId, locationInfo = {}, note = '') => {
  const stats = getPersonalStats();
  let updatedStat = null;

  const updatedStats = stats.map((stat) => {
    if (stat.id === statId) {
      const newCount = (stat.count || 0) + 1;
      updatedStat = {
        ...stat,
        count: newCount,
        lastLogged: new Date().toISOString(),
        lastLocation: stat.trackGps ? (locationInfo.city || 'Current Location') : (stat.lastLocation || 'Logged'),
        lastLat: stat.trackGps ? (locationInfo.lat || null) : null,
        lastLng: stat.trackGps ? (locationInfo.lng || null) : null
      };
      return updatedStat;
    }
    return stat;
  });

  savePersonalStats(updatedStats);

  // Add to timeline log
  let log = null;
  if (updatedStat) {
    log = addTimelineLog({
      type: 'personal',
      statId: updatedStat.id,
      statName: updatedStat.name,
      emoji: updatedStat.emoji,
      locationName: updatedStat.lastLocation,
      lat: updatedStat.lastLat,
      lng: updatedStat.lastLng,
      note: note || undefined
    });
  }

  return { updatedStat, log, allStats: updatedStats };
};

export const undoStatIncrement = (statId, logId) => {
  const stats = getPersonalStats();
  const updatedStats = stats.map((stat) => {
    if (stat.id === statId) {
      return {
        ...stat,
        count: Math.max(0, (stat.count || 0) - 1)
      };
    }
    return stat;
  });
  savePersonalStats(updatedStats);

  if (logId) {
    removeTimelineLog(logId);
  }

  return updatedStats;
};

// LOCAL MOCK SQUADS (For instant offline or pre-Supabase testing)
export const getLocalRooms = () => {
  try {
    const data = localStorage.getItem(KEYS.LOCAL_ROOMS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [
    {
      code: 'CHIP99',
      name: 'Semester Chipotle Bowls',
      emoji: '🌯',
      created_by: 'Alex',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      code: 'GYMBOI',
      name: 'Morning Gym Squad',
      emoji: '💪',
      created_by: 'Sam',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ];
};

export const getLocalRoomMembers = (roomCode) => {
  try {
    const data = localStorage.getItem(KEYS.LOCAL_MEMBERS);
    if (data) {
      const all = JSON.parse(data);
      if (all[roomCode]) return all[roomCode];
    }
  } catch (e) {
    console.error(e);
  }

  // Pre-seed mock members for CHIP99
  if (roomCode === 'CHIP99') {
    return [
      { id: 'm1', room_code: 'CHIP99', user_id: 'u1', display_name: 'Jake M.', count: 31, last_location: 'Madison, WI', last_lat: 43.073, last_lng: -89.401, last_logged_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm2', room_code: 'CHIP99', user_id: 'u2', display_name: 'Sarah K.', count: 28, last_location: 'Chicago, IL', last_lat: 41.8781, last_lng: -87.6298, last_logged_at: new Date(Date.now() - 7200000).toISOString() },
      { id: 'm3', room_code: 'CHIP99', user_id: 'u3', display_name: 'Liam T.', count: 24, last_location: 'Milwaukee, WI', last_lat: 43.0389, last_lng: -87.9065, last_logged_at: new Date(Date.now() - 14400000).toISOString() },
      { id: 'm4', room_code: 'CHIP99', user_id: 'u4', display_name: 'Chloe V.', count: 19, last_location: 'Madison, WI', last_lat: 43.074, last_lng: -89.384, last_logged_at: new Date(Date.now() - 28800000).toISOString() }
    ];
  }

  return [];
};

export const saveLocalRoomMember = (roomCode, member) => {
  try {
    let all = {};
    const existing = localStorage.getItem(KEYS.LOCAL_MEMBERS);
    if (existing) all = JSON.parse(existing);
    if (!all[roomCode]) all[roomCode] = getLocalRoomMembers(roomCode);

    const idx = all[roomCode].findIndex((m) => m.user_id === member.user_id);
    if (idx >= 0) {
      all[roomCode][idx] = { ...all[roomCode][idx], ...member };
    } else {
      all[roomCode].push(member);
    }
    localStorage.setItem(KEYS.LOCAL_MEMBERS, JSON.stringify(all));
    return all[roomCode];
  } catch (e) {
    console.error(e);
  }
};
