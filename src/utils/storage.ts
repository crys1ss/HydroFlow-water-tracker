import { DayRecord, DrinkLog, UnitType, UserSettings } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'hydroflow_settings_v2',
  HISTORY: 'hydroflow_history_v2',
};

// Conversions
export const ML_TO_OZ_FACTOR = 0.033814;
export const OZ_TO_ML_FACTOR = 29.5735;

export function formatVolume(ml: number, unit: UnitType): string {
  if (unit === 'oz') {
    const ozVal = Math.round(ml * ML_TO_OZ_FACTOR * 10) / 10;
    return `${ozVal} fl oz`;
  }
  return `${Math.round(ml)} ml`;
}

export function formatShortVolume(ml: number, unit: UnitType): string {
  if (unit === 'oz') {
    const ozVal = Math.round(ml * ML_TO_OZ_FACTOR);
    return `${ozVal} oz`;
  }
  return `${Math.round(ml)} ml`;
}

export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateKey(new Date());
}

export function formatDatePretty(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const todayStr = getTodayDateString();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  if (dateStr === todayStr) {
    return 'Today, ' + target.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  if (dateStr === yesterdayStr) {
    return 'Yesterday, ' + target.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return target.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export const DEFAULT_SETTINGS: UserSettings = {
  dailyGoal: 2500, // ml
  unit: 'ml',
  soundEnabled: true,
  hapticEnabled: true,
  weightKg: 70,
  activityLevel: 'moderate',
  reminders: {
    enabled: true,
    intervalMinutes: 90,
    startTime: '08:00',
    endTime: '22:00',
    soundEnabled: true,
    customMessage: 'Time for a refreshing sip of water! 💧',
  },
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore quota
  }
}

/**
 * Load history - starts completely empty/fresh with 0ml for new devices,
 * and maintains every manually logged day indefinitely.
 */
export function loadHistory(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history: Record<string, DayRecord> = raw ? JSON.parse(raw) : {};
    const todayStr = getTodayDateString();
    
    // Ensure today entry exists cleanly with 0ml if not yet logged
    if (!history[todayStr]) {
      const settings = loadSettings();
      history[todayStr] = {
        date: todayStr,
        total: 0,
        goal: settings.dailyGoal,
        logs: [],
      };
      saveHistory(history);
    }
    return history;
  } catch {
    const todayStr = getTodayDateString();
    const settings = loadSettings();
    return {
      [todayStr]: {
        date: todayStr,
        total: 0,
        goal: settings.dailyGoal,
        logs: [],
      },
    };
  }
}

export function saveHistory(history: Record<string, DayRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch {
    // Ignore
  }
}

export function clearAllStorageData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch {
    // Ignore
  }
}

/**
 * Calculate consecutive daily goal streak up to today (or yesterday if today is in progress)
 */
export function calculateStreak(history: Record<string, DayRecord>): number {
  let streak = 0;
  const now = new Date();
  const todayStr = getTodayDateString();
  const todayRecord = history[todayStr];

  // If today is completed, count it
  if (todayRecord && todayRecord.total >= todayRecord.goal) {
    streak++;
  }

  // Count backwards from yesterday
  const checkDate = new Date(now);
  checkDate.setDate(checkDate.getDate() - 1);

  for (let i = 0; i < 90; i++) {
    const dateStr = formatDateKey(checkDate);
    const record = history[dateStr];
    if (record && record.total >= record.goal) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get 7 days array for any week offset (0 = current 7-day window, -1 = previous week, -2 = 2 weeks ago, etc.)
 */
export function getWeekDates(offsetWeeks: number = 0): {
  dateStr: string;
  dayName: string;
  dayNumber: string;
  monthName: string;
  fullDate: Date;
}[] {
  const now = new Date();
  const days = [];
  const shiftDays = offsetWeeks * 7;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i - shiftDays));
    const dateStr = formatDateKey(d);
    days.push({
      dateStr,
      dayName: d.toLocaleDateString([], { weekday: 'short' }),
      dayNumber: String(d.getDate()),
      monthName: d.toLocaleDateString([], { month: 'short' }),
      fullDate: d,
    });
  }

  return days;
}
