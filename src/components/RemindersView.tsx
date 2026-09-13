import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Clock, Volume2, Sparkles, ShieldCheck, AlertCircle, Play, Send, Check } from 'lucide-react';
import { ReminderSettings } from '../types';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendWaterReminder,
  NotificationPermissionStatus,
} from '../utils/notifications';

interface RemindersViewProps {
  settings: ReminderSettings;
  onUpdateSettings: (updated: Partial<ReminderSettings>) => void;
  onQuickLogDrink: (amountMl: number) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  settings,
  onUpdateSettings,
  onQuickLogDrink,
}) => {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [testSent, setTestSent] = useState(false);
  const [customMsgInput, setCustomMsgInput] = useState(settings.customMessage);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermission(status);
    if (status === 'granted') {
      onUpdateSettings({ enabled: true });
      // Send welcoming confirmation notification
      sendWaterReminder(
        settings,
        'Hydration Reminders Activated! 💧',
        `You'll receive friendly sips reminders every ${settings.intervalMinutes} minutes.`
      );
    }
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    await sendWaterReminder(
      settings,
      'Hydration Check-in 💧',
      settings.customMessage || 'Take a quick sip of water to stay sharp and refreshed!'
    );
    setTimeout(() => setTestSent(false), 3000);
  };

  const intervalOptions = [
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hrs', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
  ];

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Smart Alerts
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Push Reminders
        </h1>
      </div>

      {/* Permission Status Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                permission === 'granted'
                  ? 'bg-emerald-50 text-emerald-600'
                  : permission === 'denied'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-sky-50 text-sky-600'
              }`}
            >
              {permission === 'granted' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : permission === 'denied' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <BellRing className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Browser Push Alerts
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    permission === 'granted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : permission === 'denied'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Action Required'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {permission === 'granted'
                  ? 'System notifications are authorized to notify you when time to drink.'
                  : permission === 'denied'
                  ? 'Notifications are blocked in browser settings. In-app chimes will still alert you.'
                  : 'Grant browser permission to receive push reminders even when the app is in the background.'}
              </p>
            </div>
          </div>
        </div>

        {permission !== 'granted' && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              id="btn-request-notification-perm"
              onClick={handleRequestPermission}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-semibold text-xs transition shadow-sm"
            >
              <Bell className="w-4 h-4" />
              <span>Allow Push Notifications</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs space-y-5">
        {/* Master Enabled Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900">Hydration Reminders</span>
            <p className="text-xs text-slate-500">Trigger periodic reminders to sip water</p>
          </div>
          <button
            id="toggle-reminders-enabled"
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => onUpdateSettings({ enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.enabled ? 'bg-sky-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reminder Interval */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Reminder Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {intervalOptions.map((opt) => {
              const isSelected = settings.intervalMinutes === opt.value;
              return (
                <button
                  key={opt.value}
                  id={`btn-interval-${opt.value}`}
                  type="button"
                  disabled={!settings.enabled}
                  onClick={() => onUpdateSettings({ intervalMinutes: opt.value })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/20'
                      : 'bg-slate-50/70 text-slate-600 border-slate-200 hover:bg-slate-100'
                  } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Schedule Hours */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Active Reminder Window</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-start-time" className="block text-xs font-medium text-slate-600 mb-1">
                Wake / Start Time
              </label>
              <input
                id="input-start-time"
                type="time"
                disabled={!settings.enabled}
                value={settings.startTime}
                onChange={(e) => onUpdateSettings({ startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>

            <div>
              <label htmlFor="input-end-time" className="block text-xs font-medium text-slate-600 mb-1">
                Bed / End Time
              </label>
              <input
                id="input-end-time"
                type="time"
                disabled={!settings.enabled}
                value={settings.endTime}
                onChange={(e) => onUpdateSettings({ endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Reminders will quietly pause during sleep hours.
          </p>
        </div>

        {/* Sound Toggle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-semibold text-slate-800">
                Water Chime Audio
              </span>
              <p className="text-[11px] text-slate-400">
                Play gentle harmonic droplet chime with notification
              </p>
            </div>
          </div>
          <button
            id="toggle-sound-chime"
            type="button"
            role="switch"
            aria-checked={settings.soundEnabled}
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.soundEnabled ? 'bg-sky-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.soundEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Custom Notification Message */}
        <div className="pt-2 border-t border-slate-100">
          <label htmlFor="input-custom-reminder-msg" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Custom Message Prompt
          </label>
          <div className="flex gap-2">
            <input
              id="input-custom-reminder-msg"
              type="text"
              value={customMsgInput}
              onChange={(e) => setCustomMsgInput(e.target.value)}
              onBlur={() => onUpdateSettings({ customMessage: customMsgInput.trim() || 'Time for a fresh sip of water! 💧' })}
              placeholder="e.g. Time for a refreshing sip! 💧"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-sky-500 transition"
              maxLength={60}
            />
          </div>
        </div>

        {/* Test Notification Action */}
        <div className="pt-2 border-t border-slate-100">
          <button
            id="btn-test-notification"
            onClick={handleTestNotification}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border transition text-xs font-semibold ${
              testSent
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:scale-98'
            }`}
          >
            {testSent ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Test Notification Sent! Check screen / alert</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>Test Push Notification Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
