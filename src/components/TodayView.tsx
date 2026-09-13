import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Droplets, Plus, RotateCcw, Trash2, Clock, Coffee, Sparkles, Leaf, Award, BellRing } from 'lucide-react';
import { DrinkLog, UnitType, UserSettings } from '../types';
import { formatVolume, formatShortVolume, OZ_TO_ML_FACTOR } from '../utils/storage';
import { WaterWave } from './WaterWave';
import { CustomAddModal } from './CustomAddModal';

interface TodayViewProps {
  currentMl: number;
  goalMl: number;
  unit: UnitType;
  logs: DrinkLog[];
  settings: UserSettings;
  streak: number;
  onAddDrink: (amountMl: number, beverage?: DrinkLog['beverage'], note?: string) => void;
  onRemoveLog: (logId: string) => void;
  onUndoLast: () => void;
  onNavigateToReminders: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentMl,
  goalMl,
  unit,
  logs,
  settings,
  streak,
  onAddDrink,
  onRemoveLog,
  onUndoLast,
  onNavigateToReminders,
}) => {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Quick preset buttons tailored to unit
  const presets = unit === 'oz'
    ? [
        { label: 'Small', amountMl: Math.round(5 * OZ_TO_ML_FACTOR), display: '5 oz', icon: '☕' },
        { label: 'Glass', amountMl: Math.round(8 * OZ_TO_ML_FACTOR), display: '8 oz', icon: '🥛' },
        { label: 'Mug', amountMl: Math.round(12 * OZ_TO_ML_FACTOR), display: '12 oz', icon: '🫖' },
        { label: 'Bottle', amountMl: Math.round(16 * OZ_TO_ML_FACTOR), display: '16 oz', icon: '🍶' },
      ]
    : [
        { label: 'Small', amountMl: 150, display: '150 ml', icon: '☕' },
        { label: 'Glass', amountMl: 250, display: '250 ml', icon: '🥛' },
        { label: 'Mug', amountMl: 350, display: '350 ml', icon: '🫖' },
        { label: 'Bottle', amountMl: 500, display: '500 ml', icon: '🍶' },
      ];

  const percentage = goalMl > 0 ? Math.round((currentMl / goalMl) * 100) : 0;

  // Hydration status insight
  let statusText = 'Starting off your hydration journey';
  if (percentage >= 100) {
    statusText = 'Goal achieved! Superbly hydrated today';
  } else if (percentage >= 75) {
    statusText = 'In the home stretch! One or two sips left';
  } else if (percentage >= 50) {
    statusText = 'Halfway mark conquered! Keep sipping';
  } else if (percentage >= 25) {
    statusText = 'Good momentum! Maintaining healthy rhythm';
  }

  const getBeverageIcon = (type: DrinkLog['beverage']) => {
    switch (type) {
      case 'sparkling':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
      case 'tea':
        return <Leaf className="w-3.5 h-3.5 text-amber-600" />;
      case 'infused':
        return <Leaf className="w-3.5 h-3.5 text-emerald-500" />;
      case 'coffee':
        return <Coffee className="w-3.5 h-3.5 text-stone-600" />;
      default:
        return <Droplets className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
            Today's Hydration
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Drink Water
          </h1>
        </div>

        {/* Streak Counter Badge */}
        <div
          id="streak-indicator-badge"
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 px-3 py-1.5 rounded-full shadow-xs"
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-900">
            {streak} {streak === 1 ? 'day' : 'days'} streak
          </span>
        </div>
      </div>

      {/* Visual Water Wave Container */}
      <WaterWave currentMl={currentMl} goalMl={goalMl} unit={unit} />

      {/* Motivational Status Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Droplets className="w-4 h-4 fill-sky-600/20" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">
              {statusText}
            </div>
            <div className="text-[11px] text-slate-500">
              {logs.length} drinks logged today
            </div>
          </div>
        </div>

        {/* Reminder Shortcut Pill */}
        {settings.reminders.enabled && (
          <button
            id="btn-shortcut-reminders"
            onClick={onNavigateToReminders}
            className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50/70 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg transition"
          >
            <BellRing className="w-3 h-3 text-sky-500" />
            <span>Every {settings.reminders.intervalMinutes}m</span>
          </button>
        )}
      </div>

      {/* Quick Add Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick Add
          </span>
          {logs.length > 0 && (
            <button
              id="btn-undo-last-sip"
              onClick={onUndoLast}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
              title="Undo the most recent drink"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo Last</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {presets.map((preset, idx) => (
            <motion.button
              key={preset.display}
              id={`btn-quick-add-${idx}`}
              whileTap={{ scale: 0.94 }}
              onClick={() => onAddDrink(preset.amountMl, 'water')}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 shadow-xs transition duration-150"
            >
              <span className="text-xl mb-1 group-hover:scale-110 transition-transform">
                {preset.icon}
              </span>
              <span className="text-xs font-bold text-slate-800">
                +{preset.display}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {preset.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Custom Add Trigger Button */}
        <button
          id="btn-open-custom-add"
          onClick={() => setIsCustomModalOpen(true)}
          className="mt-2.5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-semibold text-xs shadow-sm shadow-sky-600/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Custom Volume or Beverage</span>
        </button>
      </div>

      {/* Today's Intake History List */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Today's Timeline</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {formatVolume(currentMl, unit)}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-400 flex items-center justify-center mx-auto mb-2">
              <Droplets className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No drinks logged yet today</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tap any quick button above to log your first sip!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {logs.map((log) => {
              const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  id={`log-item-${log.id}`}
                  className="flex items-center justify-between py-2.5 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      {getBeverageIcon(log.beverage)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {formatVolume(log.amount, unit)}
                        </span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          {log.beverage}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {timeFormatted} {log.note ? `• ${log.note}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    id={`btn-delete-log-${log.id}`}
                    onClick={() => onRemoveLog(log.id)}
                    className="p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition opacity-80 group-hover:opacity-100"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Add Modal */}
      <CustomAddModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAdd={onAddDrink}
        unit={unit}
      />
    </div>
  );
};
