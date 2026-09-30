import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Flame,
  CheckCircle2,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Leaf,
  Coffee,
  Droplets,
  Plus,
  Clock,
  Trash2,
  Award,
  RotateCcw
} from 'lucide-react';
import { BeverageType, DayRecord, DrinkLog, UnitType } from '../types';
import {
  formatVolume,
  formatShortVolume,
  getTodayDateString,
  getWeekDates,
  formatDateKey,
  formatDatePretty,
  OZ_TO_ML_FACTOR
} from '../utils/storage';
import { CustomAddModal } from './CustomAddModal';

interface DashboardViewProps {
  history: Record<string, DayRecord>;
  goalMl: number;
  unit: UnitType;
  streak: number;
  onAddDrink?: (amountMl: number, beverage?: BeverageType, note?: string, targetDate?: string) => void;
  onRemoveLog?: (logId: string, targetDate?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  history,
  goalMl,
  unit,
  streak,
  onAddDrink,
  onRemoveLog,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedMatrixDate, setSelectedMatrixDate] = useState<string>(getTodayDateString());
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const todayStr = getTodayDateString();
  const now = new Date();

  // Get 7 days for the currently selected week offset
  const currentWeekDays = getWeekDates(weekOffset);
  const weekDaysWithRecords = currentWeekDays.map((d) => ({
    ...d,
    record: history[d.dateStr],
  }));

  // Week Date Range Label
  const startDay = weekDaysWithRecords[0];
  const endDay = weekDaysWithRecords[weekDaysWithRecords.length - 1];
  const weekRangeLabel = `${startDay.monthName} ${startDay.dayNumber} – ${endDay.monthName} ${endDay.dayNumber}, ${endDay.fullDate.getFullYear()}`;

  // Calculate metrics for selected week
  const totalWeekMl = weekDaysWithRecords.reduce((acc, curr) => acc + (curr.record?.total || 0), 0);
  const avgDailyMl = Math.round(totalWeekMl / 7);
  const daysMetGoal = weekDaysWithRecords.filter(
    (d) => (d.record?.total || 0) >= (d.record?.goal || goalMl) && (d.record?.total || 0) > 0
  ).length;
  const completionRate = Math.round((daysMetGoal / 7) * 100);

  // Max value for chart scaling
  const maxDayMl = Math.max(goalMl * 1.15, ...weekDaysWithRecords.map((d) => d.record?.total || 0), 500);

  // Selected day in the weekly chart
  const activeWeeklyDay = selectedDayKey
    ? weekDaysWithRecords.find((d) => d.dateStr === selectedDayKey) || weekDaysWithRecords[weekDaysWithRecords.length - 1]
    : weekDaysWithRecords[weekDaysWithRecords.length - 1];

  // Active record for the Monthly Matrix Inspector
  const activeMatrixRecord = history[selectedMatrixDate] || {
    date: selectedMatrixDate,
    total: 0,
    goal: goalMl,
    logs: [],
  };

  const matrixPercentage = activeMatrixRecord.goal > 0
    ? Math.round((activeMatrixRecord.total / activeMatrixRecord.goal) * 100)
    : 0;

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

  const handleLogDrinkToSelected = (amountMl: number, beverage: BeverageType = 'water', note?: string) => {
    if (onAddDrink) {
      onAddDrink(amountMl, beverage, note, selectedMatrixDate);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
            Analytics & Insights
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Progress Dashboard
          </h1>
        </div>

        {weekOffset !== 0 && (
          <button
            id="btn-return-current-week"
            onClick={() => {
              setWeekOffset(0);
              setSelectedDayKey(null);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-2.5 py-1.5 rounded-xl transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>This Week</span>
          </button>
        )}
      </div>

      {/* Week Selector Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200/70 shadow-xs flex items-center justify-between">
        <button
          id="btn-prev-week"
          onClick={() => {
            setWeekOffset((prev) => prev - 1);
            setSelectedDayKey(null);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition active:scale-95"
          title="Previous Week"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev Week</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-slate-900 block">
            {weekOffset === 0 ? 'Current Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Weeks Ago`}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {weekRangeLabel}
          </span>
        </div>

        <button
          id="btn-next-week"
          disabled={weekOffset >= 0}
          onClick={() => {
            setWeekOffset((prev) => Math.min(0, prev + 1));
            setSelectedDayKey(null);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            weekOffset >= 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-700 hover:bg-slate-100 active:scale-95'
          }`}
          title="Next Week"
        >
          <span className="hidden sm:inline">Next Week</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Daily Average */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Daily Avg
            </span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatVolume(avgDailyMl, unit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {Math.round((avgDailyMl / goalMl) * 100)}% of daily target
          </div>
        </div>

        {/* Goal Success Rate */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Goal Hit Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {completionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {daysMetGoal} of 7 days completed
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Streak
            </span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          </div>
          <div className="text-xl font-bold text-amber-600">
            {streak} {streak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Consecutive daily goals
          </div>
        </div>

        {/* Weekly Total */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Week Total
            </span>
            <Droplet className="w-4 h-4 text-sky-500 fill-sky-500/20" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatVolume(totalWeekMl, unit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Total logged in week
          </div>
        </div>
      </div>

      {/* 7-Day Visual Bar Chart */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Weekly Hydration Bar Chart</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tap any column to inspect day details
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-sky-500" />
            <span>Target: {formatShortVolume(goalMl, unit)}</span>
          </div>
        </div>

        {/* Chart Stage */}
        <div className="relative pt-6 pb-2">
          {/* Target Goal Dashed Line */}
          <div
            className="absolute left-0 right-0 border-b border-dashed border-sky-300 z-10 pointer-events-none flex items-center justify-end pr-1"
            style={{
              bottom: `${(goalMl / maxDayMl) * 160 + 36}px`,
            }}
          >
            <span className="text-[10px] font-bold text-sky-600 bg-white/90 px-1 rounded-sm">
              Goal ({formatShortVolume(goalMl, unit)})
            </span>
          </div>

          {/* Columns */}
          <div className="flex items-end justify-between h-44 px-2">
            {weekDaysWithRecords.map((item) => {
              const currentTotal = item.record?.total || 0;
              const targetGoal = item.record?.goal || goalMl;
              const heightPx = Math.max(12, Math.min(160, (currentTotal / maxDayMl) * 160));
              const isGoalMet = currentTotal >= targetGoal && currentTotal > 0;
              const isToday = item.dateStr === todayStr;
              const isSelected = (activeWeeklyDay?.dateStr === item.dateStr) || (selectedMatrixDate === item.dateStr);

              return (
                <button
                  key={item.dateStr}
                  id={`bar-day-${item.dateStr}`}
                  onClick={() => {
                    setSelectedDayKey(item.dateStr);
                    setSelectedMatrixDate(item.dateStr);
                  }}
                  className="group flex flex-col items-center flex-1 focus:outline-hidden cursor-pointer"
                >
                  {/* Floating value */}
                  <div className="h-5 flex items-center justify-center mb-1">
                    {isSelected && (
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-md animate-in fade-in zoom-in duration-150">
                        {formatShortVolume(currentTotal, unit)}
                      </span>
                    )}
                  </div>

                  {/* Bar Column */}
                  <div className="w-7 sm:w-8 flex items-end justify-center rounded-xl overflow-hidden bg-slate-100 p-0.5 transition group-hover:bg-slate-200">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPx}px` }}
                      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                      className={`w-full rounded-lg transition-colors ${
                        isGoalMet
                          ? isToday
                            ? 'bg-gradient-to-t from-sky-600 to-sky-400'
                            : 'bg-emerald-500'
                          : currentTotal > 0
                          ? isToday
                            ? 'bg-sky-400'
                            : 'bg-sky-300'
                          : 'bg-slate-200'
                      } ${isSelected ? 'ring-2 ring-sky-500 ring-offset-1' : ''}`}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-[11px] block leading-none font-semibold ${
                        isToday ? 'text-sky-600 font-bold' : isSelected ? 'text-slate-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {item.dayName}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {item.dayNumber}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 30-Day Monthly Habit Matrix with Interactive Date Selection */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Monthly Habit Matrix</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click on any date to inspect details & water intake
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Past 30 Days
          </span>
        </div>

        {/* 30 interactive buttons grid */}
        <div className="grid grid-cols-10 gap-2 py-2">
          {Array.from({ length: 30 }).map((_, idx) => {
            const d = new Date(now);
            d.setDate(d.getDate() - (29 - idx));
            const dateStr = formatDateKey(d);
            const rec = history[dateStr];
            const ratio = rec && rec.goal > 0 ? rec.total / rec.goal : 0;
            const isToday = dateStr === todayStr;
            const isSelected = selectedMatrixDate === dateStr;

            let dotBg = 'bg-slate-100 hover:bg-slate-200';
            let textColor = 'text-slate-600';

            if (ratio >= 1) {
              dotBg = 'bg-sky-600 hover:bg-sky-700';
              textColor = 'text-white';
            } else if (ratio >= 0.7) {
              dotBg = 'bg-sky-400 hover:bg-sky-500';
              textColor = 'text-white';
            } else if (ratio > 0) {
              dotBg = 'bg-sky-200 hover:bg-sky-300';
              textColor = 'text-sky-900';
            }

            return (
              <motion.button
                key={dateStr}
                id={`matrix-dot-${dateStr}`}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setSelectedMatrixDate(dateStr);
                  setSelectedDayKey(dateStr);
                }}
                title={`${formatDatePretty(dateStr)}: ${rec ? formatVolume(rec.total, unit) : '0 ml'}`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition duration-150 cursor-pointer ${dotBg} ${textColor} ${
                  isSelected
                    ? 'ring-3 ring-amber-400 ring-offset-2 scale-110 shadow-md z-10'
                    : isToday
                    ? 'ring-2 ring-sky-500 ring-offset-1'
                    : ''
                }`}
              >
                {d.getDate()}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-3 pt-2 text-[10px] text-slate-400 border-t border-slate-100">
          <span className="font-medium text-slate-500">Tap date to view logs</span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-200" /> 0%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-200" /> &lt;70%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-400" /> 70-99%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-600" /> 100%+
            </span>
          </div>
        </div>
      </div>

      {/* Selected Date Details Inspector Panel */}
      <div className="bg-gradient-to-br from-white to-sky-50/40 rounded-2xl p-4 border border-sky-200/80 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-3 border-b border-sky-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                Selected Day Details
              </span>
              {selectedMatrixDate === todayStr && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                  Today
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {formatDatePretty(selectedMatrixDate)}
            </h3>
          </div>

          <div className="text-right">
            <div className="text-lg font-black text-sky-700">
              {formatVolume(activeMatrixRecord.total, unit)}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Goal: {formatVolume(activeMatrixRecord.goal || goalMl, unit)} ({matrixPercentage}%)
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                matrixPercentage >= 100
                  ? 'bg-emerald-500'
                  : matrixPercentage >= 70
                  ? 'bg-sky-500'
                  : 'bg-sky-300'
              }`}
              style={{ width: `${Math.min(100, matrixPercentage)}%` }}
            />
          </div>
        </div>

        {/* Itemized drink list for this date */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Drink Timeline ({activeMatrixRecord.logs.length} logged)</span>
            </span>

            {onAddDrink && (
              <button
                id="btn-add-drink-selected-date"
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log to this date</span>
              </button>
            )}
          </div>

          {activeMatrixRecord.logs.length === 0 ? (
            <div className="py-5 text-center bg-white/80 rounded-xl border border-dashed border-slate-200">
              <Droplets className="w-6 h-6 text-slate-300 mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-600">No drinks recorded for this date</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click "+ Log to this date" if you wish to record historical intake!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeMatrixRecord.logs.map((log) => {
                const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/90 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {getBeverageIcon(log.beverage)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {formatVolume(log.amount, unit)}
                          </span>
                          <span className="text-[9px] uppercase font-semibold text-slate-400 bg-slate-100 px-1 py-0.2 rounded-xs">
                            {log.beverage}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {timeFormatted} {log.note ? `• ${log.note}` : ''}
                        </span>
                      </div>
                    </div>

                    {onRemoveLog && (
                      <button
                        onClick={() => onRemoveLog(log.id, selectedMatrixDate)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-md hover:bg-rose-50 transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hydration Science Tip */}
      <div className="bg-gradient-to-br from-sky-50 to-indigo-50/40 rounded-2xl p-4 border border-sky-100 shadow-xs flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900">Hydration Science Tip</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Consistently drinking small amounts throughout the day keeps cellular absorption higher than chugging large amounts at once. Start your morning with a 350ml glass within 15 minutes of waking to jump-start metabolism.
          </p>
        </div>
      </div>

      {/* Custom Add Modal for Selected Date */}
      <CustomAddModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onAdd={handleLogDrinkToSelected}
        unit={unit}
      />
    </div>
  );
};

