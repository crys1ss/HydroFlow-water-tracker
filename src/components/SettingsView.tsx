import React, { useState } from 'react';
import { Settings, Sliders, Volume2, Smartphone, Calculator, RefreshCw, Check, Info } from 'lucide-react';
import { UnitType, UserSettings } from '../types';
import { formatVolume, OZ_TO_ML_FACTOR } from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (updated: Partial<UserSettings>) => void;
  onResetToday: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetToday,
}) => {
  const [weightKg, setWeightKg] = useState<number>(settings.weightKg || 70);
  const [activity, setActivity] = useState<'sedentary' | 'moderate' | 'active'>(
    settings.activityLevel || 'moderate'
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

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

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Preferences
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
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

      {/* Reset Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800">Reset Today's Intake</span>
          <p className="text-[11px] text-slate-400">Clear today's drinks back to 0</p>
        </div>
        <button
          id="btn-reset-today-logs"
          onClick={handleConfirmReset}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
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
              <span>Reset</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
