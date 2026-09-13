import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, X, Plus } from 'lucide-react';
import { UnitType } from '../types';
import { formatShortVolume, OZ_TO_ML_FACTOR } from '../utils/storage';

interface InAppReminderBannerProps {
  notification: { title: string; body: string } | null;
  unit: UnitType;
  onDismiss: () => void;
  onQuickLog: (amountMl: number) => void;
}

export const InAppReminderBanner: React.FC<InAppReminderBannerProps> = ({
  notification,
  unit,
  onDismiss,
  onQuickLog,
}) => {
  if (!notification) return null;

  const quickMl = unit === 'oz' ? Math.round(8 * OZ_TO_ML_FACTOR) : 250;

  return (
    <AnimatePresence>
      <motion.div
        id="in-app-push-banner"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        className="fixed top-3 left-3 right-3 max-w-md mx-auto z-50 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 shadow-xl border border-sky-200/80 ring-1 ring-sky-500/10"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-sky-500/30">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{notification.title}</span>
                <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">
                  Reminder
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                {notification.body}
              </p>

              {/* Quick Drink Action */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  id="btn-reminder-quick-log"
                  onClick={() => {
                    onQuickLog(quickMl);
                    onDismiss();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log +{formatShortVolume(quickMl, unit)} Now</span>
                </button>
                <button
                  id="btn-reminder-snooze"
                  onClick={onDismiss}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition"
                >
                  Later
                </button>
              </div>
            </div>
          </div>

          <button
            id="btn-dismiss-reminder-banner"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
