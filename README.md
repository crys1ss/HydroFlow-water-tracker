# 💧 Water Tracker

> A clean, minimalist daily water intake tracker featuring smooth fluid wave animations, smart push notification reminders, and a visual progress dashboard — crafted for a seamless experience across iOS, Android, and Desktop.

---

## 🌟 Key Features

### 🌊 Fluid Wave Gauge & Quick Logging
- **Real-Time Wave Simulation**: Dual-layer animated wave container with rising bubbles, dynamic fill levels, and celebratory milestone confetti when you hit 100%.
- **One-Tap Presets**: Instant log buttons for Small (+150 ml), Glass (+250 ml), Mug (+350 ml), and Bottle (+500 ml) or fluid ounces (`fl oz`).
- **Custom Drink Logging**: Record custom intake volumes, drink categories (*Plain Water, Sparkling, Infused, Herbal Tea, Coffee*), and personalized notes.
- **Daily Timeline & Undo**: Interactive log history with timestamps, beverage tags, and immediate undo actions.

### 🔔 Smart Push Notification Reminders
- **System & Browser Push**: Native push notifications via the Web Notifications API.
- **In-App Slide-Down Banners**: Non-intrusive interactive alerts with a one-tap **"Log Drink Now"** action.
- **Custom Schedules**: Set reminder frequencies (every 30m to 3 hours), quiet sleep windows (*start & end times*), and custom message prompts.
- **Instant Testing**: One-click **"Test Push Notification Now"** button to preview alerts and sound effects.

### 📊 Visual Progress Dashboard & Analytics
- **7-Day Interactive Bar Chart**: Visualizes daily intake against your target with interactive day-by-day inspections.
- **Key Metrics**:
  - **Daily Average**: Your average hydration volume across the week.
  - **Goal Hit Rate**: Percentage of days you completed your target.
  - **Active Streak**: Consecutive days meeting your hydration objective.
  - **Total Volume**: Total hydration logged over the past 7 days.
- **30-Day Habit Matrix**: Color-coded month-view grid showing hydration consistency.
- **Hydration Insights**: Science-backed tips to optimize water absorption and daily energy.

### 📱 Designed for iOS & Android
- **Mobile-First Interface**: Bottom navigation bar with safe-area spacing and fluid touch interactions.
- **Zero-Asset Web Audio Synthesizer**: Crystal-clear liquid droplet clicks, harmonic reminder chimes, and goal triumph fanfares generated directly via the Web Audio API.
- **Tactile Haptic Feedback**: Subtle vibration cues on mobile tap actions.
- **PWA & Home Screen Ready**: Installable on Android and iOS Safari with step-by-step guidance.
- **Smart Target Calculator**: Recommends personalized intake goals using body weight and activity levels.
- **Unit Flexibility**: Effortlessly toggle between **Milliliters (`ml`)** and **Fluid Ounces (`fl oz`)**.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Celebration Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Sound Effects**: Native Web Audio API (no external audio assets required)
- **Storage**: Client-side `localStorage` with offline persistence

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/water-tracker.git
   cd water-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📦 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server on port 3000 |
| `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| `npm run lint` | Runs TypeScript type checking via `tsc --noEmit` |

---

## 📂 Project Structure

```
├── public/
│   └── icon.svg              # App icon and PWA favicon
├── src/
│   ├── components/
│   │   ├── CustomAddModal.tsx       # Custom drink logging dialog
│   │   ├── DashboardView.tsx        # 7-day chart, 30-day matrix & metrics
│   │   ├── GoalCelebration.tsx      # Milestone confetti & achievement banner
│   │   ├── InAppReminderBanner.tsx  # In-app push notification banner
│   │   ├── Navigation.tsx           # Mobile bottom navigation bar
│   │   ├── PWAInstallButton.tsx     # PWA install & iOS Add to Home Screen guide
│   │   ├── RemindersView.tsx        # Notification intervals & schedules
│   │   ├── SettingsView.tsx         # Units, goals, audio & haptic options
│   │   ├── TodayView.tsx            # Main intake screen with quick presets
│   │   └── WaterWave.tsx            # Animated dual-wave liquid vessel
│   ├── hooks/
│   │   └── usePWAInstall.ts         # Hook for install prompts & iOS detection
│   ├── utils/
│   │   ├── audio.ts                 # Web Audio API procedural sound generators
│   │   ├── notifications.ts         # Push notification & schedule dispatcher
│   │   └── storage.ts               # Local persistence, units & streak logic
│   ├── types.ts                     # TypeScript definitions
│   ├── App.tsx                      # Root component & state orchestrator
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Tailwind CSS configuration
├── index.html                       # HTML5 template with mobile meta tags
├── package.json
└── README.md
```

---

## 📱 Mobile Installation (PWA)

- **iOS (Safari)**: Tap the **Share** icon at the bottom of Safari, scroll down, and tap **"Add to Home Screen"**.
- **Android (Chrome)**: Tap the **"Install App"** prompt in the app or the menu button (**⋮**) and select **"Add to Home screen"**.

---

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).
