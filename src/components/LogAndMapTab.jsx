import React, { useState, useEffect, useRef } from 'react';
import {
  ListFilter,
  MapPin,
  Clock,
  MessageSquare,
  Navigation,
  Trash2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import L from 'leaflet';
import { formatRelativeTime, formatExactDateTime, getCurrentPosition, reverseGeocode } from '../lib/geolocation';

export default function LogAndMapTab({ logs, onDeleteLog, onUpdateLogNote, onAddManualLog }) {
  const [activeSubTab, setActiveSubTab] = useState('feed'); // 'feed' | 'map'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'personal' | 'squad'
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (filterType === 'personal') return l.type === 'personal';
    if (filterType === 'squad') return l.type === 'squad';
    return true;
  });

  // Filter logs that have valid GPS coordinates
  const mappedLogs = logs.filter((l) => l.lat != null && l.lng != null);

  // Unique cities count
  const uniqueCities = Array.from(
    new Set(logs.map((l) => l.locationName).filter((loc) => loc && !loc.includes('°')))
  );

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (activeSubTab !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Madison, WI (or first mapped log, or US center)
      const defaultLat = mappedLogs[0]?.lat || 43.0731;
      const defaultLng = mappedLogs[0]?.lng || -89.4012;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: mappedLogs.length > 0 ? 11 : 4,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Dark Matter tiles for ultra-sleek #09090b aesthetic
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd'
        }
      ).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    // Refresh markers
    if (markersGroupRef.current && mapInstanceRef.current) {
      markersGroupRef.current.clearLayers();

      mappedLogs.forEach((item) => {
        // Create custom emoji marker HTML
        const iconHtml = `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-[#18181b] border-2 border-emerald-400 flex items-center justify-center text-sm shadow-lg shadow-emerald-500/30 transform hover:scale-125 transition-transform">
              ${item.emoji || '📍'}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-emoji-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18]
        });

        const popupContent = `
          <div style="background:#18181b; color:#fff; padding:10px; border-radius:12px; border:1px solid #27272a; font-family:sans-serif; min-width:180px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span style="font-size:18px;">${item.emoji || '📍'}</span>
              <strong style="font-size:13px; color:#fff;">${item.statName}</strong>
            </div>
            <div style="font-size:11px; color:#10b981; margin-bottom:4px;">📍 ${item.locationName || 'Logged'}</div>
            <div style="font-size:10px; color:#a1a1aa;">${formatExactDateTime(item.timestamp)}</div>
            ${item.note ? `<div style="font-size:11px; color:#e4e4e7; margin-top:6px; background:#09090b; padding:4px 8px; border-radius:6px;">"${item.note}"</div>` : ''}
          </div>
        `;

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });
        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-leaflet-popup'
        });
        markersGroupRef.current.addLayer(marker);
      });

      if (mappedLogs.length > 0) {
        mapInstanceRef.current.fitBounds(markersGroupRef.current.getBounds(), {
          padding: [40, 40],
          maxZoom: 14
        });
      }
    }

    return () => {
      // Map stays alive unless unmounted
    };
  }, [activeSubTab, logs]);

  // Center on current user location
  const handleLocateMe = async () => {
    const pos = await getCurrentPosition();
    if (pos.success && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([pos.lat, pos.lng], 14, { duration: 1.5 });
    }
  };

  const handleSaveNote = (logId) => {
    onUpdateLogNote(logId, noteInput.trim());
    setEditingNoteId(null);
    setNoteInput('');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Toggle: Feed vs Map */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-2 flex items-center justify-between shadow-xl">
        <div className="flex space-x-1 flex-1">
          <button
            onClick={() => setActiveSubTab('feed')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all tap-bounce flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'feed'
                ? 'bg-zinc-800 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline Feed ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('map')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all tap-bounce flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'map'
                ? 'bg-gradient-to-r from-emerald-500 to-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Life Map ({mappedLogs.length})</span>
          </button>
        </div>
      </div>

      {/* FEED SUBTAB */}
      {activeSubTab === 'feed' && (
        <div className="space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              All Logs ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('personal')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === 'personal'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setFilterType('squad')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === 'squad'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              Squads
            </button>
          </div>

          {/* Timeline Feed Items */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl">
              <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">No logs match this filter.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => {
                const isEditing = editingNoteId === log.id;

                return (
                  <div
                    key={log.id}
                    className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3.5 hover:border-zinc-700 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left: Emoji + Name + Timestamp + Location */}
                      <div className="flex items-start space-x-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-xl bg-[#09090b] border border-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
                          {log.emoji || '🔥'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-sm text-white truncate">
                              +1 {log.statName}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                log.type === 'squad'
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {log.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400 mt-0.5">
                            <span title={formatExactDateTime(log.timestamp)}>
                              {formatRelativeTime(log.timestamp)}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-500 text-[10px]">
                              {formatExactDateTime(log.timestamp)}
                            </span>
                          </div>

                          {/* Location Pin Badge */}
                          {log.locationName && (
                            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium mt-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{log.locationName}</span>
                              {log.lat != null && (
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  ({log.lat.toFixed(2)}, {log.lng.toFixed(2)})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingNoteId(null);
                            } else {
                              setEditingNoteId(log.id);
                              setNoteInput(log.note || '');
                            }
                          }}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            log.note
                              ? 'text-violet-400 hover:bg-violet-500/10'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                          }`}
                          title="Add/Edit Note"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 text-xs"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note display or Edit Box */}
                    {isEditing ? (
                      <div className="mt-2.5 pt-2 border-t border-[#27272a] flex space-x-2">
                        <input
                          type="text"
                          maxLength={100}
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Add a quick note (e.g. Double scoop, with Sarah...)"
                          className="flex-1 bg-[#09090b] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveNote(log.id)}
                          className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    ) : log.note ? (
                      <div className="mt-2 text-xs text-zinc-300 bg-[#09090b]/80 border border-zinc-800 rounded-xl px-3 py-1.5 italic flex items-center space-x-1.5">
                        <span className="text-zinc-500 not-italic">“</span>
                        <span>{log.note}</span>
                        <span className="text-zinc-500 not-italic">”</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MAP SUBTAB */}
      {activeSubTab === 'map' && (
        <div className="space-y-3">
          {/* Map Stats Card */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-2.5 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-mono font-bold text-white text-sm">
                  {mappedLogs.length}
                </div>
                <div className="text-[10px] text-zinc-400">GPS Geo-stamped Points</div>
              </div>
            </div>

            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-2.5 flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-violet-400" />
              <div>
                <div className="font-mono font-bold text-white text-sm">
                  {uniqueCities.length}
                </div>
                <div className="text-[10px] text-zinc-400">Unique Cities</div>
              </div>
            </div>
          </div>

          {/* Leaflet Map Container */}
          <div className="relative rounded-2xl overflow-hidden border border-[#27272a] h-[420px] shadow-2xl bg-[#09090b]">
            <div ref={mapContainerRef} className="w-full h-full leaflet-dark z-0" />

            {/* Floating 'Locate Me' Button */}
            <button
              onClick={handleLocateMe}
              className="absolute top-3 right-3 z-10 px-3 py-2 rounded-xl bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] text-xs font-semibold text-white shadow-xl hover:border-emerald-500 flex items-center space-x-1.5 tap-bounce"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Locate Me</span>
            </button>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-10 bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-xl px-2.5 py-1.5 text-[10px] text-zinc-300">
              ⚡ Tap any emoji marker to view stat memory
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
