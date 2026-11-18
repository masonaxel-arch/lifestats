import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';

export default function InstallPwaBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if user dismissed previously in this session
    if (sessionStorage.getItem('lifestats_hide_pwa_banner')) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // Chrome/Android install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If on iOS Safari, show the handy guide banner
    if (isAppleDevice) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('lifestats_hide_pwa_banner', 'true');
  };

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-violet-950/60 to-zinc-900 border-b border-violet-500/20 px-4 py-2.5 text-xs text-zinc-300">
      <div className="max-w-md mx-auto flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2 min-w-0">
          <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="min-w-0">
            {isIos ? (
              <p className="truncate text-[11px]">
                Install on iPhone: Tap <span className="text-white font-bold">Share</span> then{' '}
                <span className="text-emerald-400 font-bold">'Add to Home Screen'</span>
              </p>
            ) : deferredPrompt ? (
              <p className="truncate text-[11px]">
                Install LifeStats for offline lifetime tracking!
              </p>
            ) : (
              <p className="truncate text-[11px]">
                Add LifeStats to Home Screen for the full app experience
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {deferredPrompt && (
            <button
              onClick={handleAndroidInstall}
              className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold text-[10px]"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-white p-1 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
