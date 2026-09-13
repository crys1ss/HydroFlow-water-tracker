import React, { useState } from 'react';
import { Download, Share, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div id="pwa-installed-badge" className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>PWA Installed</span>
      </div>
    );
  }

  return (
    <>
      {isInstallable && (
        <button
          id="btn-pwa-install-android"
          onClick={install}
          className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 transition px-3.5 py-2 text-xs font-semibold text-white shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {isIOS && (
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 transition px-3 py-1.5 text-xs font-medium text-sky-800"
        >
          <Share className="w-3.5 h-3.5" />
          <span>Add to Home Screen</span>
        </button>
      )}

      {showIOSGuide && (
        <div id="ios-install-guide-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Install on iOS</h3>
              <button
                id="btn-close-ios-guide"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                  1
                </span>
                <p>Tap the <strong>Share</strong> button in Safari toolbar at the bottom.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                  2
                </span>
                <p>Scroll down and tap <strong>Add to Home Screen</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                  3
                </span>
                <p>Enjoy quick full-screen access and hydration push alerts on your lock screen.</p>
              </div>
            </div>
            <button
              id="btn-dismiss-ios-guide"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
