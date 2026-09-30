import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Volume2,
  Smartphone,
  Calculator,
  RefreshCw,
  Check,
  Info,
  User,
  Edit2,
  LogOut,
  Sparkles,
  ShieldCheck,
  Mail,
  Save,
  X,
  UserPlus
} from 'lucide-react';
import { UnitType, UserProfile, UserSettings } from '../types';
import { formatVolume, OZ_TO_ML_FACTOR } from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';
import { triggerHapticFeedback } from '../utils/audio';

interface SettingsViewProps {
  settings: UserSettings;
  user: UserProfile | null;
  onUpdateSettings: (updated: Partial<UserSettings>) => void;
  onUpdateProfile: (nickname: string, avatar?: string) => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onResetToday: () => void;
  onClearAllHistory?: () => void;
}

const AVATAR_OPTIONS = ['💧', '🌊', '⚡', '🌿', '🫖', '🏃‍♂️', '🐬', '🏔️', '🌟', '👑'];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  user,
  onUpdateSettings,
  onUpdateProfile,
  onLogout,
  onSwitchAccount,
  onResetToday,
  onClearAllHistory,
}) => {
  const [weightKg, setWeightKg] = useState<number>(settings.weightKg || 70);
  const [activity, setActivity] = useState<'sedentary' | 'moderate' | 'active'>(
    settings.activityLevel || 'moderate'
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [wipeConfirmed, setWipeConfirmed] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempNickname, setTempNickname] = useState(user?.nickname || '');
  const [tempAvatar, setTempAvatar] = useState(user?.avatar || '💧');
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  const handleStartEditProfile = () => {
    setTempNickname(user?.nickname || '');
    setTempAvatar(user?.avatar || '💧');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNickname.trim()) return;
    triggerHapticFeedback([15]);
    onUpdateProfile(tempNickname.trim(), tempAvatar);
    setIsEditingProfile(false);
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 2500);
  };

  // Smart hydration formula: 35ml per kg of bodyweight + activity adjustment
  const calculateRecommendedGoal = (kg: number, act: 'sedentary' | 'moderate' | 'active') => {
    let base = kg * 35;
    if (act === 'moderate') base += 350;
    if (act === 'active') base += 750;
    return Math.round(base / 50) * 50; // Round to nearest 50ml
  };

  const handleApplyRecommended = () => {
    const recommended = calculateRecommendedGoal(weightKg, activity);
    onUpdateSettings({
      dailyGoal: recommended,
      weightKg,
      activityLevel: activity,
    });
    setShowCalculator(false);
  };

  const goalPresets = settings.unit === 'oz'
    ? [
        { label: '68 oz', ml: Math.round(68 * OZ_TO_ML_FACTOR) },
        { label: '84 oz', ml: Math.round(84 * OZ_TO_ML_FACTOR) },
        { label: '100 oz', ml: Math.round(100 * OZ_TO_ML_FACTOR) },
        { label: '120 oz', ml: Math.round(120 * OZ_TO_ML_FACTOR) },
      ]
    : [
        { label: '2,000 ml', ml: 2000 },
        { label: '2,500 ml', ml: 2500 },
        { label: '3,000 ml', ml: 3000 },
        { label: '3,500 ml', ml: 3500 },
      ];

  const handleConfirmReset = () => {
    if (window.confirm("Are you sure you want to reset today's water intake logs?")) {
      onResetToday();
      setResetConfirmed(true);
      setTimeout(() => setResetConfirmed(false), 2500);
    }
  };

  const handleConfirmWipe = () => {
    if (window.confirm("Are you sure you want to clear ALL history and start completely fresh? This cannot be undone.")) {
      if (onClearAllHistory) {
        onClearAllHistory();
      }
      setWipeConfirmed(true);
      setTimeout(() => setWipeConfirmed(false), 2500);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })
    : 'Recently';

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Preferences & Account
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
      </div>

      {/* USER PROFILE & ACCOUNT CARD */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-slate-50 rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">User Profile</h2>
          </div>

          {profileSavedFeedback && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md animate-in fade-in">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}

          {user && !isEditingProfile && (
            <button
              id="btn-edit-profile-nickname"
              onClick={handleStartEditProfile}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-white hover:bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/80 shadow-2xs transition cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Nickname</span>
            </button>
          )}
        </div>

        {user ? (
          !isEditingProfile ? (
            <div className="pt-3.5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-white border border-sky-200 shadow-xs flex items-center justify-center text-3xl shrink-0">
                    {user.avatar || '💧'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">
                        {user.nickname}
                      </span>
                      {user.authProvider === 'google' ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                          </svg>
                          Google
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded-md">
                          <Mail className="w-2.5 h-2.5" />
                          Email
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {user.email}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Member since {memberSince}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Actions (Switch / Sign Out) */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100/80">
                <button
                  id="btn-switch-account"
                  onClick={onSwitchAccount}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Switch Account</span>
                </button>
                <button
                  id="btn-logout"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out?')) {
                      onLogout();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/70 text-xs font-semibold text-rose-700 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Inline Edit Profile Form */
            <form onSubmit={handleSaveProfile} className="pt-3.5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Change Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setTempAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                        tempAvatar === emoji
                          ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  id="btn-save-edited-nickname"
                  type="submit"
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Nickname</span>
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="pt-3 text-center space-y-3">
            <p className="text-xs text-slate-500">
              You are currently using HydroFlow as a guest. Sign in to save your nickname and sync progress!
            </p>
            <button
              onClick={onSwitchAccount}
              className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 shadow-xs"
            >
              Sign In or Create Account
            </button>
          </div>
        )}
      </div>

      {/* Daily Target Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daily Target</h2>
            <p className="text-xs text-slate-500">Your personalized hydration objective</p>
          </div>
          <span className="text-base font-extrabold text-sky-600">
            {formatVolume(settings.dailyGoal, settings.unit)}
          </span>
        </div>

        {/* Target Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {goalPresets.map((preset) => {
            const isSelected = Math.abs(settings.dailyGoal - preset.ml) < 25;
            return (
              <button
                key={preset.label}
                id={`btn-target-preset-${preset.label}`}
                onClick={() => onUpdateSettings({ dailyGoal: preset.ml })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/20'
                    : 'bg-slate-50/70 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Smart Goal Calculator Trigger */}
        <div className="pt-2 border-t border-slate-100">
          {!showCalculator ? (
            <button
              id="btn-open-calculator"
              onClick={() => setShowCalculator(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              <Calculator className="w-3.5 h-3.5 text-sky-600" />
              <span>Calculate Ideal Goal Based on Weight & Activity</span>
            </button>
          ) : (
            <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Smart Hydration Calculator</span>
                <button
                  onClick={() => setShowCalculator(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Body Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={35}
                    max={200}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 70)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Daily Activity
                  </label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value as 'sedentary' | 'moderate' | 'active')}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
                  >
                    <option value="sedentary">Sedentary (Desk)</option>
                    <option value="moderate">Moderate (Daily walk)</option>
                    <option value="active">Active (Sports/Gym)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-600">
                  Recommendation:{' '}
                  <strong className="text-sky-700">
                    {formatVolume(calculateRecommendedGoal(weightKg, activity), settings.unit)}
                  </strong>
                </div>
                <button
                  id="btn-apply-recommended-goal"
                  onClick={handleApplyRecommended}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition"
                >
                  Apply Goal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Units & Audio & Haptics Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">App Preferences</h2>

        {/* Unit Selector */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-800">Measurement Unit</span>
            <p className="text-[11px] text-slate-400">Display intake in Milliliters or Fluid Ounces</p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/50">
            <button
              id="btn-unit-ml"
              onClick={() => onUpdateSettings({ unit: 'ml' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.unit === 'ml'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ml
            </button>
            <button
              id="btn-unit-oz"
              onClick={() => onUpdateSettings({ unit: 'oz' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.unit === 'oz'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              fl oz
            </button>
          </div>
        </div>

        {/* Sound Effects on Log */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-semibold text-slate-800">Water Drop Sounds</span>
              <p className="text-[11px] text-slate-400">Play pleasant droplet feedback when logging drinks</p>
            </div>
          </div>
          <button
            id="toggle-app-sound"
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

        {/* Mobile Haptic Feedback */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-semibold text-slate-800">Haptic Vibration</span>
              <p className="text-[11px] text-slate-400">Gentle tactile feedback on iOS & Android</p>
            </div>
          </div>
          <button
            id="toggle-app-haptics"
            type="button"
            role="switch"
            aria-checked={settings.hapticEnabled}
            onClick={() => onUpdateSettings({ hapticEnabled: !settings.hapticEnabled })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.hapticEnabled ? 'bg-sky-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.hapticEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* PWA & Mobile Installation Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Mobile Installation</h2>
            <p className="text-xs text-slate-500">Install to iOS Home Screen or Android device</p>
          </div>
          <PWAInstallButton />
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Installing allows you to launch full-screen directly from your home screen and ensures push notifications wake your device properly.
        </p>
      </div>

      {/* Reset & Wipe Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Data Management</h2>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-800">Reset Today's Intake</span>
            <p className="text-[11px] text-slate-400">Clear today's drinks back to 0</p>
          </div>
          <button
            id="btn-reset-today-logs"
            onClick={handleConfirmReset}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              resetConfirmed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-100/70'
            }`}
          >
            {resetConfirmed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Reset Done</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Today</span>
              </>
            )}
          </button>
        </div>

        {onClearAllHistory && (
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-rose-700">Wipe All History</span>
              <p className="text-[11px] text-slate-400">Clear all past logs and start with a 100% fresh slate</p>
            </div>
            <button
              id="btn-wipe-all-history"
              onClick={handleConfirmWipe}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                wipeConfirmed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              {wipeConfirmed ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>All Cleared</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear All Data</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
