import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VivelyLogo } from './VivelyLogo';

interface SplashScreenProps {
  onFinish?: () => void;
  autoDismissDelay?: number; // milliseconds
}

// Background from https://postimg.cc/gXT7dhPz
export const WHITE_BACKGROUND_URL = 'https://i.postimg.cc/prWMfQGF/white-background.png';

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  autoDismissDelay = 2600,
}) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const [progress, setProgress] = useState(12);

  // Animated loading progress counter
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2200; // ms to reach 100%

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          handleDismiss();
        }, 220);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setTimeout(() => {
      onFinish?.();
    }, 280);
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          key="onboarding-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onClick={handleDismiss}
          className="relative flex-1 w-full h-full min-h-[640px] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer bg-white"
        >
          {/* Background from https://postimg.cc/gXT7dhPz */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            style={{
              backgroundImage: `url('${WHITE_BACKGROUND_URL}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Shimmer Light Reflection Sweep Across the Background */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ x: '-120%', opacity: 0 }}
            animate={{ x: '160%', opacity: [0, 0.45, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 0.8,
              ease: 'easeInOut',
            }}
            style={{
              background:
                'linear-gradient(110deg, transparent 25%, rgba(255, 255, 255, 0.5) 50%, transparent 75%)',
            }}
          />

          {/* Center: Animated Logo with NO white background (pure transparent logo) */}
          <div className="relative z-20 flex flex-col items-center justify-center space-y-4">
            <VivelyLogo className="w-32 sm:w-36 h-auto" />

            {/* 3 Animated Bouncing Dots below logo */}
            <div className="flex items-center space-x-2 pt-1">
              <motion.span
                className="w-2.5 h-2.5 rounded-full bg-zinc-900 shadow-2xs"
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="w-2.5 h-2.5 rounded-full bg-zinc-900 shadow-2xs"
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.18 }}
              />
              <motion.span
                className="w-2.5 h-2.5 rounded-full bg-zinc-900 shadow-2xs"
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.36 }}
              />
            </div>
          </div>

          {/* Bottom: Animated Loading Bar & Indicator */}
          <div className="absolute bottom-10 inset-x-0 z-20 flex flex-col items-center space-y-2 pointer-events-none px-8">
            <div className="flex items-center justify-between w-48 text-[11px] font-semibold text-zinc-600">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B4A7D6] animate-pulse" />
                <span>Loading creator hub...</span>
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">{progress}%</span>
            </div>

            {/* Sleek progress bar */}
            <div className="w-48 h-1.5 bg-zinc-200/80 rounded-full overflow-hidden shadow-inner p-[0.5px]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#B4A7D6] via-[#A697CE] to-[#8C7AB8] rounded-full shadow-xs"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>

            <p className="text-[10px] text-zinc-400 font-normal pt-1">
              Tap anywhere to skip →
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
