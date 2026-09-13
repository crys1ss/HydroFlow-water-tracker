import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playGoalAchievedSound, triggerHapticFeedback } from '../utils/audio';

interface GoalCelebrationProps {
  show: boolean;
  onDismiss: () => void;
  dailyGoalFormatted: string;
}

export const GoalCelebration: React.FC<GoalCelebrationProps> = ({
  show,
  onDismiss,
  dailyGoalFormatted,
}) => {
  useEffect(() => {
    if (show) {
      playGoalAchievedSound();
      triggerHapticFeedback([100, 50, 100, 50, 200]);

      // Fire confetti burst from both sides
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7, x: 0.3 },
          colors: ['#38bdf8', '#0284c7', '#34d399', '#fbbf24'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7, x: 0.7 },
            colors: ['#38bdf8', '#0284c7', '#34d399', '#fbbf24'],
          });
        }, 200);
      } catch {
        // Fallback gracefully
      }
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="goal-celebration-banner"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-500 p-4 text-white shadow-xl shadow-sky-900/15 border border-sky-300/30 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Daily Hydration Goal Met!</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <p className="text-xs text-sky-100 font-medium mt-0.5">
                Outstanding! You reached your {dailyGoalFormatted} target today.
              </p>
            </div>
          </div>
          <button
            id="btn-dismiss-celebration"
            onClick={onDismiss}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
