import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';

interface HomeAdsBannerProps {
  onOpenHowToUse: () => void;
  onFilterSeptember: () => void;
  onGoToProfile: () => void;
}

export const HomeAdsBanner: React.FC<HomeAdsBannerProps> = ({
  onOpenHowToUse,
  onFilterSeptember,
  onGoToProfile,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const slides = [
    {
      id: 'ad-profile-opt',
      categoryTag: 'Profile Optimization',
      title: 'Fill your profile and get better\nopportunities',
      description: 'Complete your creator profile to get faster approvals and higher brand deals.',
      buttonText: 'Fill Here!',
      onClick: onGoToProfile,
    },
    {
      id: 'ad-vively-moments',
      categoryTag: 'Vively Moments',
      title: 'Capture your campaign journey\nin Vively Moments',
      description: 'A lightweight, photo-first visual diary to casually share campaign milestones.',
      buttonText: 'Explore!',
      onClick: onOpenHowToUse,
    },
    {
      id: 'ad-brand-collab',
      categoryTag: 'Brand Partnerships',
      title: 'Discover South Korean brand\ncollaborations',
      description: 'Connect with verified K-beauty, lifestyle, and fashion partners in Seoul.',
      buttonText: 'Learn More',
      onClick: onOpenHowToUse,
    },
  ];

  // Auto-play timer (pauses on hover / touch)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const slide = slides[currentSlide];

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-[#ECEEF2] rounded-[28px] p-5 sm:p-6 shadow-2xs relative overflow-hidden cursor-pointer"
          onClick={slide.onClick}
        >
          {/* Top row: Category tag & 3 dots icon */}
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-semibold text-zinc-600">
              {slide.categoryTag}
            </span>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 -mr-1"
              aria-label="More options"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <h2 className="font-extrabold text-lg text-black mt-2 leading-tight tracking-tight">
            {slide.title}
          </h2>

          {/* Subtitle / Description */}
          <p className="text-xs text-zinc-600 leading-relaxed mt-2 max-w-[90%] font-normal">
            {slide.description}
          </p>

          {/* Bottom row with Action Button Pill matching Screenshot 1 */}
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                slide.onClick();
              }}
              className="bg-white text-zinc-900 font-black italic tracking-wide text-xs px-5 py-2 rounded-full shadow-xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer uppercase"
            >
              {slide.buttonText}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
