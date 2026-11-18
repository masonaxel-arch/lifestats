import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import PersonalStatsTab from './components/PersonalStatsTab';
import SquadsTab from './components/SquadsTab';
import LogAndMapTab from './components/LogAndMapTab';
import WrappedTab from './components/WrappedTab';
import NewStatModal from './components/NewStatModal';
import ToastContainer from './components/ToastContainer';
import InstallPwaBanner from './components/InstallPwaBanner';

import {
  initLocalStorage,
  getPersonalStats,
  savePersonalStats,
  addPersonalStat,
  incrementPersonalStat,
  undoStatIncrement,
  clearSampleStats,
  deletePersonalStat,
  getTimelineLogs,
  addTimelineLog,
  removeTimelineLog,
  saveTimelineLogs,
  getUserProfile,
  saveUserProfile,
  getLocalRooms,
  getLocalRoomMembers
} from './lib/storage';
import { getCurrentPosition, reverseGeocode } from './lib/geolocation';

export default function App() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userProfile, setUserProfile] = useState({ id: 'usr_init', displayName: 'You' });
  const [isNewStatOpen, setIsNewStatOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // Initialize data on mount
  useEffect(() => {
    initLocalStorage();
    setStats(getPersonalStats());
    setLogs(getTimelineLogs());
    setUserProfile(getUserProfile());

    // Check if URL has ?room=CODE or ?tab=wrapped
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setActiveTab('squads');
    } else if (params.get('tab')) {
      setActiveTab(params.get('tab'));
    }
  }, []);

  // Show a toast message with automatic dismissal
  const showToast = (message, type = 'info', extra = {}) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type, ...extra });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // INCREMENT PERSONAL STAT
  const handleIncrementStat = async (stat) => {
    let locationInfo = { city: null, lat: null, lng: null };

    // Capture GPS if stat has trackGps enabled
    if (stat.trackGps) {
      const pos = await getCurrentPosition();
      if (pos.success) {
        locationInfo.lat = pos.lat;
        locationInfo.lng = pos.lng;
        locationInfo.city = await reverseGeocode(pos.lat, pos.lng);
      }
    }

    const { updatedStat, log, allStats } = incrementPersonalStat(stat.id, locationInfo);
    setStats(allStats);
    setLogs(getTimelineLogs());

    // Show Undo Toast
    showToast(`Logged +1 for ${stat.name}`, 'undo', {
      statId: stat.id,
      statName: stat.name,
      emoji: stat.emoji,
      location: locationInfo.city,
      logId: log?.id
    });
  };

  // UNDO LAST STAT INCREMENT
  const handleUndoToast = (toastData) => {
    if (!toastData.statId) return;
    const updated = undoStatIncrement(toastData.statId, toastData.logId);
    setStats(updated);
    setLogs(getTimelineLogs());
    showToast(`Undid +1 for ${toastData.statName}`);
  };

  // CREATE NEW PERSONAL STAT
  const handleAddStat = (newStatData) => {
    const created = addPersonalStat(newStatData);
    setStats(getPersonalStats());

    // If starting count > 0, also log to timeline
    if (created.count > 0) {
      addTimelineLog({
        type: 'personal',
        statId: created.id,
        statName: created.name,
        emoji: created.emoji,
        locationName: created.lastLocation,
        lat: created.lastLat,
        lng: created.lastLng,
        note: 'Started tracking'
      });
      setLogs(getTimelineLogs());
    }

    showToast(`Created stat "${created.name}"!`);
  };

  // CLEAR SAMPLE STATS
  const handleClearSamples = () => {
    const nonSamples = clearSampleStats();
    setStats(nonSamples);
    showToast('Starter sample stats cleared');
  };

  // DELETE PERSONAL STAT
  const handleDeleteStat = (statId) => {
    const updated = deletePersonalStat(statId);
    setStats(updated);
    showToast('Stat removed');
  };

  // RESET PERSONAL STAT COUNT
  const handleResetStat = (statId) => {
    const all = getPersonalStats();
    const updated = all.map((s) => (s.id === statId ? { ...s, count: 0, lastLogged: null } : s));
    savePersonalStats(updated);
    setStats(updated);
    showToast('Stat counter reset to 0');
  };

  // TIMELINE LOG ACTIONS
  const handleDeleteLog = (logId) => {
    const updated = removeTimelineLog(logId);
    setLogs(updated);
    showToast('Log entry deleted');
  };

  const handleUpdateLogNote = (logId, note) => {
    const all = getTimelineLogs();
    const updated = all.map((l) => (l.id === logId ? { ...l, note } : l));
    saveTimelineLogs(updated);
    setLogs(updated);
    showToast('Note updated!');
  };

  const handleAddTimelineLog = (logData) => {
    const newLog = addTimelineLog(logData);
    setLogs(getTimelineLogs());
    return newLog;
  };

  // PROFILE ACTIONS
  const handleUpdateProfile = (profile) => {
    saveUserProfile(profile);
    setUserProfile(profile);
    showToast(`Display name updated to "${profile.displayName}"`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between">
      {/* Centered Mobile Container (max-width 480px on desktop) */}
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col bg-[#09090b] sm:border-x sm:border-[#27272a]/60 shadow-2xl relative">
        {/* Apple PWA Install Banner */}
        <InstallPwaBanner />

        {/* Top Sticky Header */}
        <Header
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Main Tab Content */}
        <main className="flex-1 px-4 pt-4">
          {activeTab === 'stats' && (
            <PersonalStatsTab
              stats={stats}
              onIncrementStat={handleIncrementStat}
              onOpenNewModal={() => setIsNewStatOpen(true)}
              onClearSamples={handleClearSamples}
              onDeleteStat={handleDeleteStat}
              onResetStat={handleResetStat}
            />
          )}

          {activeTab === 'squads' && (
            <SquadsTab
              userProfile={userProfile}
              onAddTimelineLog={handleAddTimelineLog}
              showToast={showToast}
            />
          )}

          {activeTab === 'map' && (
            <LogAndMapTab
              logs={logs}
              onDeleteLog={handleDeleteLog}
              onUpdateLogNote={handleUpdateLogNote}
            />
          )}

          {activeTab === 'wrapped' && (
            <WrappedTab
              stats={stats}
              logs={logs}
              userProfile={userProfile}
              rooms={getLocalRooms()}
              getLocalRoomMembers={getLocalRoomMembers}
              showToast={showToast}
            />
          )}
        </main>

        {/* Floating Undo Toast */}
        <ToastContainer
          toast={toast}
          onUndo={handleUndoToast}
          onDismiss={() => setToast(null)}
        />

        {/* Sticky 4-Tab Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Create New Stat Modal */}
        <NewStatModal
          isOpen={isNewStatOpen}
          onClose={() => setIsNewStatOpen(false)}
          onAddStat={handleAddStat}
        />
      </div>
    </div>
  );
}
