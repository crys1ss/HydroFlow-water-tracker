import React, { useState, useEffect, useRef } from 'react';
import { NavTab, UserSettings, DayRecord, DrinkLog } from './types';
import {
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  getTodayDateString,
  calculateStreak,
  formatVolume,
} from './utils/storage';
import { playWaterDropSound, triggerHapticFeedback } from './utils/audio';
import {
  sendWaterReminder,
  isWithinActiveHours,
  subscribeToInAppNotifications,
} from './utils/notifications';
import { Navigation } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { DashboardView } from './components/DashboardView';
import { RemindersView } from './components/RemindersView';
import { SettingsView } from './components/SettingsView';
import { InAppReminderBanner } from './components/InAppReminderBanner';
import { GoalCelebration } from './components/GoalCelebration';
import { Droplet, Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [history, setHistory] = useState<Record<string, DayRecord>>(() => loadHistory());
  const [currentTab, setCurrentTab] = useState<NavTab>('today');
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile-frame' | 'responsive'>('mobile-frame');

  const todayStr = getTodayDateString();
  const todayRecord = history[todayStr] || {
    date: todayStr,
    total: 0,
    goal: settings.dailyGoal,
    logs: [],
  };

  const streak = calculateStreak(history);

  // Sync settings to storage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Sync history to storage
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Subscribe to in-app notification alerts
  useEffect(() => {
    const unsubscribe = subscribeToInAppNotifications((title, body) => {
      setActiveNotification({ title, body });
      // Auto-hide in-app notification after 8 seconds
      setTimeout(() => {
        setActiveNotification((current) => (current?.title === title ? null : current));
      }, 8000);
    });
    return unsubscribe;
  }, []);

  // Background Reminder Scheduler
  useEffect(() => {
    if (!settings.reminders.enabled) return;

    // Check every 30 seconds
    const intervalId = setInterval(() => {
      const now = Date.now();
      const lastNotified = settings.reminders.lastNotifiedTime || 0;
      const intervalMs = settings.reminders.intervalMinutes * 60 * 1000;

      // Check active hours (e.g. 08:00 - 22:00)
      const inHours = isWithinActiveHours(settings.reminders.startTime, settings.reminders.endTime);

      if (inHours && now - lastNotified >= intervalMs) {
        sendWaterReminder(settings.reminders);
        setSettings((prev) => ({
          ...prev,
          reminders: {
            ...prev.reminders,
            lastNotifiedTime: now,
          },
        }));
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [settings.reminders]);

  // Handle adding a drink
  const handleAddDrink = (amountMl: number, beverage: DrinkLog['beverage'] = 'water', note?: string) => {
    if (settings.soundEnabled) {
      playWaterDropSound();
    }
    if (settings.hapticEnabled) {
      triggerHapticFeedback([20]);
    }

    const newLog: DrinkLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amount: amountMl,
      timestamp: Date.now(),
      beverage,
      note,
    };

    const prevTotal = todayRecord.total;
    const newTotal = prevTotal + amountMl;

    // Trigger goal celebration if user just crossed 100% of their daily goal
    if (prevTotal < settings.dailyGoal && newTotal >= settings.dailyGoal) {
      setShowCelebration(true);
    }

    setHistory((prev) => ({
      ...prev,
      [todayStr]: {
        ...todayRecord,
        total: newTotal,
        logs: [newLog, ...todayRecord.logs],
      },
    }));
  };

  // Remove a specific log
  const handleRemoveLog = (logId: string) => {
    const logToRemove = todayRecord.logs.find((l) => l.id === logId);
    if (!logToRemove) return;

    if (settings.hapticEnabled) {
      triggerHapticFeedback([10]);
    }

    setHistory((prev) => ({
      ...prev,
      [todayStr]: {
        ...todayRecord,
        total: Math.max(0, todayRecord.total - logToRemove.amount),
        logs: todayRecord.logs.filter((l) => l.id !== logId),
      },
    }));
  };

  // Undo the most recent log
  const handleUndoLast = () => {
    if (todayRecord.logs.length === 0) return;
    const [mostRecent] = todayRecord.logs;
    handleRemoveLog(mostRecent.id);
  };

  // Reset today's intake back to 0
  const handleResetToday = () => {
    if (settings.hapticEnabled) {
      triggerHapticFeedback([15, 30, 15]);
    }
    setHistory((prev) => ({
      ...prev,
      [todayStr]: {
        ...todayRecord,
        total: 0,
        logs: [],
      },
    }));
  };

  // Update settings helper
  const handleUpdateSettings = (updated: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      // If daily goal changed, also update today's target
      if (updated.dailyGoal && updated.dailyGoal !== prev.dailyGoal) {
        setHistory((h) => ({
          ...h,
          [todayStr]: {
            ...todayRecord,
            goal: updated.dailyGoal!,
          },
        }));
      }
      return next;
    });
  };

  // Update reminders helper
  const handleUpdateReminders = (updated: Partial<UserSettings['reminders']>) => {
    setSettings((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        ...updated,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:py-6 selection:bg-sky-200">
      {/* Top Desktop Helper Toolbar */}
      <header className="w-full max-w-md hidden sm:flex items-center justify-between px-3 py-1.5 mb-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Droplet className="w-3.5 h-3.5 text-sky-600 fill-sky-600" />
          <span className="text-slate-700 font-semibold">Water Tracker</span>
          <span className="text-slate-400">• iOS & Android Ready</span>
        </div>

        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            id="btn-toggle-view-mobile"
            onClick={() => setViewMode('mobile-frame')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
              viewMode === 'mobile-frame'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Mobile Device Shell"
          >
            <Smartphone className="w-3 h-3" />
            <span>Mobile</span>
          </button>
          <button
            id="btn-toggle-view-fluid"
            onClick={() => setViewMode('responsive')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
              viewMode === 'responsive'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Fluid Full Width"
          >
            <Monitor className="w-3 h-3" />
            <span>Full</span>
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <main
        id="app-viewport-container"
        className={`w-full bg-slate-50 relative min-h-screen sm:min-h-[780px] sm:max-h-[920px] transition-all overflow-y-auto ${
          viewMode === 'mobile-frame'
            ? 'sm:max-w-md sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800'
            : 'max-w-xl sm:rounded-3xl sm:shadow-lg sm:border sm:border-slate-200'
        }`}
      >
        {/* Mobile Device Status Bar Notch (in mobile shell mode on desktop) */}
        {viewMode === 'mobile-frame' && (
          <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-slate-700 select-none">
            <span>09:41</span>
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2 rounded-xs border border-current flex items-center p-0.5">
                <div className="w-full h-full bg-current rounded-2xs" />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic In-App Push Notification Alert Banner */}
        <InAppReminderBanner
          notification={activeNotification}
          unit={settings.unit}
          onDismiss={() => setActiveNotification(null)}
          onQuickLog={(amount) => handleAddDrink(amount, 'water', 'From notification reminder')}
        />

        {/* Milestone Goal Celebration */}
        <GoalCelebration
          show={showCelebration}
          onDismiss={() => setShowCelebration(false)}
          dailyGoalFormatted={formatVolume(settings.dailyGoal, settings.unit)}
        />

        {/* Active Tab View */}
        <div className="p-4 sm:p-5">
          {currentTab === 'today' && (
            <TodayView
              currentMl={todayRecord.total}
              goalMl={todayRecord.goal}
              unit={settings.unit}
              logs={todayRecord.logs}
              settings={settings}
              streak={streak}
              onAddDrink={handleAddDrink}
              onRemoveLog={handleRemoveLog}
              onUndoLast={handleUndoLast}
              onNavigateToReminders={() => setCurrentTab('reminders')}
            />
          )}

          {currentTab === 'progress' && (
            <DashboardView
              history={history}
              goalMl={settings.dailyGoal}
              unit={settings.unit}
              streak={streak}
            />
          )}

          {currentTab === 'reminders' && (
            <RemindersView
              settings={settings.reminders}
              onUpdateSettings={handleUpdateReminders}
              onQuickLogDrink={(amount) => handleAddDrink(amount, 'water')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetToday={handleResetToday}
            />
          )}
        </div>

        {/* Fixed Mobile Bottom Navigation */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          remindersActive={settings.reminders.enabled}
        />
      </main>
    </div>
  );
}
