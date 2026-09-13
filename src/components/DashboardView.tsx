import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Calendar, Flame, CheckCircle2, Droplet, Info, Award } from 'lucide-react';
import { DayRecord, UnitType } from '../types';
import { formatVolume, formatShortVolume, getTodayDateString } from '../utils/storage';

interface DashboardViewProps {
  history: Record<string, DayRecord>;
  goalMl: number;
  unit: UnitType;
  streak: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  history,
  goalMl,
  unit,
  streak,
}) => {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Generate last 7 days array
  const todayStr = getTodayDateString();
  const past7Days: { dateStr: string; dayName: string; dayNumber: string; record?: DayRecord }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    const dayNumber = String(d.getDate());
    past7Days.push({
      dateStr,
      dayName,
      dayNumber,
      record: history[dateStr],
    });
  }

  // Calculate weekly metrics
  const totalWeekMl = past7Days.reduce((acc, curr) => acc + (curr.record?.total || 0), 0);
  const avgDailyMl = Math.round(totalWeekMl / 7);
  const daysMetGoal = past7Days.filter((d) => (d.record?.total || 0) >= (d.record?.goal || goalMl)).length;
  const completionRate = Math.round((daysMetGoal / 7) * 100);

  // Max value for bar scaling (at least goalMl * 1.2 to give headroom)
  const maxDayMl = Math.max(goalMl * 1.15, ...past7Days.map((d) => d.record?.total || 0));

  const activeDay = selectedDayKey
    ? past7Days.find((d) => d.dateStr === selectedDayKey)
    : past7Days[past7Days.length - 1];

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Analytics & Insights
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Progress Dashboard
        </h1>
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
            {Math.round((avgDailyMl / goalMl) * 100)}% of daily goal
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
            Consistent hydration
          </div>
        </div>

        {/* Weekly Total */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Volume
            </span>
            <Droplet className="w-4 h-4 text-sky-500 fill-sky-500/20" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatVolume(totalWeekMl, unit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Logged past 7 days
          </div>
        </div>
      </div>

      {/* 7-Day Visual Bar Chart */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Weekly Hydration</span>
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
              Goal
            </span>
          </div>

          {/* Columns */}
          <div className="flex items-end justify-between h-44 px-2">
            {past7Days.map((item) => {
              const currentTotal = item.record?.total || 0;
              const targetGoal = item.record?.goal || goalMl;
              const heightPx = Math.max(12, Math.min(160, (currentTotal / maxDayMl) * 160));
              const isGoalMet = currentTotal >= targetGoal;
              const isToday = item.dateStr === todayStr;
              const isSelected = activeDay?.dateStr === item.dateStr;

              return (
                <button
                  key={item.dateStr}
                  id={`bar-day-${item.dateStr}`}
                  onClick={() => setSelectedDayKey(item.dateStr)}
                  className="group flex flex-col items-center flex-1 focus:outline-hidden"
                >
                  {/* Floating value on select or hover */}
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
                          : isToday
                          ? 'bg-sky-400'
                          : 'bg-slate-300'
                      } ${isSelected ? 'ring-2 ring-sky-500 ring-offset-1' : ''}`}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-[11px] block leading-none font-semibold ${
                        isToday ? 'text-sky-600 font-bold' : 'text-slate-600'
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

        {/* Selected Day Detail Card */}
        {activeDay && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-xl p-3">
            <div>
              <span className="text-xs font-bold text-slate-800">
                {activeDay.dayName}, {activeDay.dateStr === todayStr ? 'Today' : activeDay.dateStr}
              </span>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {activeDay.record?.logs.length || 0} drinks recorded
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-sky-700">
                {formatVolume(activeDay.record?.total || 0, unit)}
              </span>
              <div className="text-[11px] font-medium text-slate-400">
                Target: {formatVolume(activeDay.record?.goal || goalMl, unit)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 30-Day Consistency Grid */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Monthly Habit Matrix</span>
          </h2>
          <span className="text-[11px] text-slate-400">Past 30 Days</span>
        </div>

        {/* 30 dots grid */}
        <div className="grid grid-cols-10 gap-2 py-1">
          {Array.from({ length: 30 }).map((_, idx) => {
            const d = new Date(now);
            d.setDate(d.getDate() - (29 - idx));
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const rec = history[dateStr];
            const ratio = rec ? rec.total / rec.goal : 0;
            const isToday = dateStr === todayStr;

            let dotBg = 'bg-slate-100';
            if (ratio >= 1) dotBg = 'bg-sky-600';
            else if (ratio >= 0.7) dotBg = 'bg-sky-400';
            else if (ratio > 0) dotBg = 'bg-sky-200';

            return (
              <div
                key={dateStr}
                id={`matrix-dot-${idx}`}
                title={`${dateStr}: ${rec ? formatVolume(rec.total, unit) : '0 ml'}`}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold transition-transform hover:scale-125 ${dotBg} ${
                  ratio >= 0.7 ? 'text-white' : 'text-slate-500'
                } ${isToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
              >
                {d.getDate()}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-3 mt-3 pt-2 text-[10px] text-slate-400 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-slate-200" /> 0%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-sky-200" /> &lt;70%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-sky-400" /> 70-99%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-sky-600" /> 100%+
          </span>
        </div>
      </div>

      {/* Hydration Insights & Health Tip */}
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
    </div>
  );
};
