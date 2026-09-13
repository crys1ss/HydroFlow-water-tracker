import { DayRecord, DrinkLog, UnitType, UserSettings } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'water_tracker_settings_v1',
  HISTORY: 'water_tracker_history_v1',
  TODAY: 'water_tracker_today_v1',
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

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_SETTINGS: UserSettings = {
  dailyGoal: 2500, // ml (approx 84 fl oz)
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
 * Generate initial realistic 7-day history for the progress dashboard
 */
function generateInitialHistory(): Record<string, DayRecord> {
  const history: Record<string, DayRecord> = {};
  const goal = 2500;
  const now = new Date();

  // Create previous 6 days
  for (let i = 6; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Vary between 2000ml and 2700ml to show a realistic habit curve
    const percentages = [0.85, 1.05, 0.92, 1.0, 0.88, 1.04];
    const factor = percentages[(i - 1) % percentages.length];
    const total = Math.round(goal * factor);

    const logs: DrinkLog[] = [
      { id: `seed-${dateStr}-1`, amount: 350, timestamp: new Date(d.setHours(8, 30)).getTime(), beverage: 'water' },
      { id: `seed-${dateStr}-2`, amount: 500, timestamp: new Date(d.setHours(11, 15)).getTime(), beverage: 'water' },
      { id: `seed-${dateStr}-3`, amount: 350, timestamp: new Date(d.setHours(14, 0)).getTime(), beverage: 'tea' },
      { id: `seed-${dateStr}-4`, amount: 500, timestamp: new Date(d.setHours(16, 45)).getTime(), beverage: 'water' },
      { id: `seed-${dateStr}-5`, amount: total - 1700, timestamp: new Date(d.setHours(19, 30)).getTime(), beverage: 'water' },
    ];

    history[dateStr] = {
      date: dateStr,
      total,
      goal,
      logs,
    };
  }

  // Today with an initial morning hydration entry
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
    // Ignore storage quota
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
    
    // Ensure today entry exists
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
  let checkDate = new Date(now);
  checkDate.setDate(checkDate.getDate() - 1);

  for (let i = 0; i < 60; i++) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
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
