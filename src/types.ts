export type UnitType = 'ml' | 'oz';

export type BeverageType = 'water' | 'sparkling' | 'tea' | 'infused' | 'coffee';

export interface DrinkLog {
  id: string;
  amount: number; // always stored in ml internally
  timestamp: number; // epoch ms
  beverage: BeverageType;
  note?: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  total: number; // in ml
  goal: number; // in ml
  logs: DrinkLog[];
}

export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 60, 90, 120
  startTime: string; // "08:00"
  endTime: string; // "22:00"
  soundEnabled: boolean;
  customMessage: string;
  lastNotifiedTime?: number;
}

export interface UserSettings {
  dailyGoal: number; // in ml
  unit: UnitType;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  weightKg?: number;
  activityLevel?: 'sedentary' | 'moderate' | 'active';
  reminders: ReminderSettings;
}

export type NavTab = 'today' | 'progress' | 'reminders' | 'settings';
