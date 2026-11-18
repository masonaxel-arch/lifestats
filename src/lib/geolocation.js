// Geolocation and OpenStreetMap Nominatim reverse geocoding utility

const GEO_CACHE_KEY = 'lifestats_geocache';

const getCache = () => {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const setCache = (key, val) => {
  try {
    const c = getCache();
    c[key] = val;
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c));
  } catch (e) {}
};

/**
 * Get current browser GPS coordinates
 */
export const getCurrentPosition = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ success: false, error: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          success: true,
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy)
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        resolve({
          success: false,
          error: err.message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Reverse geocode lat, lng to city, state/country via OpenStreetMap Nominatim
 */
export const reverseGeocode = async (lat, lng) => {
  if (lat == null || lng == null) return 'Unknown Location';

  // Round key to ~1km precision for caching
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cache = getCache();
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county;
      const state = addr.state_code || (addr.state ? addr.state.substring(0, 2).toUpperCase() : '');
      const country = addr.country_code ? addr.country_code.toUpperCase() : '';

      let formatted = '';
      if (city && state) {
        formatted = `${city}, ${state}`;
      } else if (city && country) {
        formatted = `${city}, ${country}`;
      } else if (city) {
        formatted = city;
      } else if (addr.state && country) {
        formatted = `${addr.state}, ${country}`;
      } else {
        formatted = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
      }

      setCache(cacheKey, formatted);
      return formatted;
    }
  } catch (err) {
    // If blocked or offline, fallback to coordinates
  }

  const fallback = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  return fallback;
};

/**
 * Format timestamp into friendly relative string: "2h ago", "Just now", etc.
 */
export const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Never';
  const now = Date.now();
  const past = new Date(isoString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (isNaN(diffSec) || diffSec < 0) return 'Just now';
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format full exact date & time: "Nov 18, 2026 • 3:04 PM"
 */
export const formatExactDateTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
