import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Check } from 'lucide-react';
import { UnitType } from '../types';
import { formatVolume } from '../utils/storage';

interface WaterWaveProps {
  currentMl: number;
  goalMl: number;
  unit: UnitType;
}

export const WaterWave: React.FC<WaterWaveProps> = ({ currentMl, goalMl, unit }) => {
  const percentage = goalMl > 0 ? Math.min(Math.round((currentMl / goalMl) * 100), 100) : 0;
  const isGoalAchieved = currentMl >= goalMl && goalMl > 0;
  const remainingMl = Math.max(0, goalMl - currentMl);

  // Animated wave offset state
  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let start = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - start) / 1000;
      setWaveOffset(elapsed * 50); // Speed of wave motion
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Water level in container percentage (min 5% so there is always a hint of water, max 96% so top curvature looks great)
  const clampedHeight = Math.max(4, Math.min(96, percentage));

  return (
    <div className="relative flex flex-col items-center justify-center my-2">
      {/* Outer droplet/cylinder vessel */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2.5 bg-gradient-to-b from-sky-100/80 via-white to-sky-50 shadow-[0_12px_36px_rgba(2,132,199,0.12)] border border-sky-100/80 flex items-center justify-center">
        
        {/* Vessel interior mask */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-50/50 border border-sky-200/50">
          
          {/* Background depth tone */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-50/30 to-sky-100/40" />

          {/* Animated Water Fill */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 overflow-hidden"
            initial={{ height: '0%' }}
            animate={{ height: `${clampedHeight}%` }}
            transition={{ type: 'spring', damping: 25, stiffness: 60 }}
          >
            {/* SVG Dual Wave */}
            <div className="absolute inset-0 bg-gradient-to-t from-sky-600 via-sky-500 to-sky-400">
              {/* Secondary deep wave */}
              <svg
                className="absolute -top-4 w-[200%] h-8 opacity-40"
                style={{
                  transform: `translateX(-${(waveOffset * 0.7) % 50}%)`,
                }}
                viewBox="0 0 1000 60"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 30 C 150 50 350 10 500 30 C 650 50 850 10 1000 30 L 1000 60 L 0 60 Z"
                  fill="#0284c7"
                />
              </svg>

              {/* Primary surface wave */}
              <svg
                className="absolute -top-3 w-[200%] h-7 opacity-75"
                style={{
                  transform: `translateX(-${(waveOffset * 1.1) % 50}%)`,
                }}
                viewBox="0 0 1000 60"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 25 C 125 5 375 45 500 25 C 625 5 875 45 1000 25 L 1000 60 L 0 60 Z"
                  fill="#38bdf8"
                />
              </svg>

              {/* Rising water bubbles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <span className="absolute left-[20%] bottom-3 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                <span className="absolute left-[45%] bottom-8 w-2 h-2 bg-white/30 rounded-full animate-ping" />
                <span className="absolute left-[70%] bottom-5 w-1 h-1 bg-white/50 rounded-full animate-bounce" />
              </div>
            </div>

            {/* Glowing surface meniscus */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </motion.div>

          {/* Glass Specular Reflection Highlight */}
          <div className="absolute top-3 left-8 w-14 h-24 bg-gradient-to-b from-white/60 to-transparent rounded-full transform -rotate-25 pointer-events-none blur-[1px]" />
          <div className="absolute bottom-4 right-10 w-8 h-8 bg-white/10 rounded-full pointer-events-none blur-xs" />

          {/* Center Information Overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
            {isGoalAchieved ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30 mb-1">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {percentage}%
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-100 mt-0.5">
                  Goal Met!
                </span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`text-4xl sm:text-5xl font-extrabold tracking-tight transition-colors duration-300 ${
                      percentage > 55 ? 'text-white drop-shadow-md' : 'text-slate-800'
                    }`}
                  >
                    {percentage}
                  </span>
                  <span
                    className={`text-xl font-bold transition-colors duration-300 ${
                      percentage > 55 ? 'text-sky-100' : 'text-slate-400'
                    }`}
                  >
                    %
                  </span>
                </div>
                <div
                  className={`text-xs font-medium mt-1 transition-colors duration-300 ${
                    percentage > 55 ? 'text-sky-100/90' : 'text-slate-500'
                  }`}
                >
                  {remainingMl > 0 ? (
                    <span>{formatVolume(remainingMl, unit)} left</span>
                  ) : (
                    <span>Complete</span>
                  )}
                </div>
              </div>
            )}

            {/* Current vs Target volume badge */}
            <div
              className={`mt-2.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs transition-colors duration-300 ${
                percentage > 55
                  ? 'bg-sky-950/20 text-white border border-white/20'
                  : 'bg-white/80 text-slate-700 shadow-xs border border-sky-100'
              }`}
            >
              {formatVolume(currentMl, unit)} / {formatVolume(goalMl, unit)}
            </div>
          </div>
        </div>

        {/* Milestone Indicator Icon at Top-Right */}
        {isGoalAchieved && (
          <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-lg border-2 border-white animate-pulse">
            <Sparkles className="w-4 h-4 fill-amber-950" />
          </div>
        )}
      </div>
    </div>
  );
};
