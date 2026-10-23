import React from 'react';
import { motion } from 'motion/react';

interface VivelyLogoProps {
  className?: string;
  animate?: boolean;
}

// Logo extracted from https://postimg.cc/t7Hb1Q0F with complete transparency
export const VIVELY_LOGO_SRC = '/vively-logo.png';

export const VivelyLogo: React.FC<VivelyLogoProps> = ({
  className = 'w-32 sm:w-36 h-auto',
  animate = true,
}) => {
  return (
    <motion.div
      initial={animate ? { scale: 0.86, opacity: 0, y: 8 } : false}
      animate={
        animate
          ? {
              scale: [1, 1.045, 1],
              y: [0, -4, 0],
              opacity: 1,
            }
          : undefined
      }
      transition={
        animate
          ? {
              scale: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.4 },
            }
          : undefined
      }
      className="relative flex items-center justify-center select-none"
    >
      <img
        src={VIVELY_LOGO_SRC}
        alt="Vively Logo"
        className={`${className} object-contain select-none pointer-events-none`}
        style={{
          mixBlendMode: 'multiply',
          backgroundColor: 'transparent',
        }}
        draggable={false}
      />
    </motion.div>
  );
};
