import { DayRecord, DrinkLog, UnitType, UserSettings } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'water_tracker_settings_v1',
  HISTORY: 'water_tracker_history_v1',
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

/**
 * Generate 30-day rich history so all monthly matrix dots and previous weeks are fully populated
 */
function generateInitialHistory(): Record<string, DayRecord> {
  const history: Record<string, DayRecord> = {};
  const goal = 2500;
  const now = new Date();

  // Factors for past 30 days to create a natural, realistic habit pattern
  const habitFactors = [
    0.85, 1.05, 0.92, 1.0, 0.88, 1.08, 0.95, // Week -4
    0.90, 1.02, 1.10, 0.80, 0.95, 1.05, 1.00, // Week -3
    0.88, 0.96, 1.04, 1.12, 0.90, 1.02, 0.98, // Week -2
    0.92, 1.04, 1.08, 0.86, 0.98, 1.06, 1.02, 0.94 // Week -1 & recent
  ];

  for (let i = 29; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    
    const factor = habitFactors[(29 - i) % habitFactors.length];
    const total = Math.round(goal * factor);

    const logCount = factor >= 1 ? 5 : 4;
    const baseAmounts = [400, 500, 350, 500, total - 1750];
    const logs: DrinkLog[] = [];

    for (let l = 0; l < logCount; l++) {
      const amt = l === logCount - 1 ? Math.max(250, total - logs.reduce((s, x) => s + x.amount, 0)) : (baseAmounts[l] || 350);
      const hours = [8, 11, 14, 17, 20][l] || 12;
      const logDate = new Date(d);
      logDate.setHours(hours, 15 + l * 5, 0, 0);

      logs.push({
        id: `seed-${dateStr}-${l + 1}`,
        amount: amt,
        timestamp: logDate.getTime(),
        beverage: l === 2 ? 'tea' : l === 4 ? 'infused' : 'water',
        note: l === 0 ? 'Morning hydration' : undefined,
      });
    }

    const calculatedTotal = logs.reduce((sum, l) => sum + l.amount, 0);

    history[dateStr] = {
      date: dateStr,
      total: calculatedTotal,
      goal,
      logs,
    };
  }

  // Today with an initial entry
  const todayStr = getTodayDateString();
  const morningDate = new Date();
  morningDate.setHours(8, 30, 0, 0);

  history[todayStr] = {
    date: todayStr,
    total: 500,
    goal,
    logs: [
      {
        id: `log-${Date.now()}-initial`,
        amount: 500,
        timestamp: morningDate.getTime(),
        beverage: 'water',
        note: 'Morning wake-up glass',
      },
    ],
  };

  return history;
}

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

export function loadHistory(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      const initial = generateInitialHistory();
      saveHistory(initial);
      return initial;
    }
    const history = JSON.parse(raw);
    const todayStr = getTodayDateString();
    
    // Ensure today entry exists if not present
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
    return generateInitialHistory();
  }
}

export function saveHistory(history: Record<string, DayRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
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
