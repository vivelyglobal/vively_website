import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Globe, HeartHandshake, Film, Coins, ArrowRight, 
  ChevronLeft, ChevronRight, CheckCircle2 
} from 'lucide-react';

interface WalkthroughCarouselProps {
  onFinishWalkthrough: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

const SLIDES = [
  {
    id: 1,
    title: 'Welcome to Vively Global',
    subtitle: 'THE PREMIER K-CREATOR HUB',
    description: 'Connect directly with iconic South Korean beauty, fashion, lifestyle, and stay brands. Step into Seoul’s creative pulse wherever you are.',
    badge: 'Global Creators x Seoul Brands',
    visualIcon: Globe,
    accentColor: 'bg-black text-white',
    bgBadge: 'bg-zinc-100 text-black',
    stat: '3,800+ Verified Creators',
    statSub: 'Across 48 Countries',
    graphic: (
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-[#B5A8DE]/20 rounded-full animate-pulse-subtle" />
        <div className="relative z-10 w-36 h-36 bg-black rounded-3xl shadow-xl flex flex-col items-center justify-center text-white p-4">
          <Globe className="w-12 h-12 mb-2 text-[#B5A8DE] drop-shadow" />
          <span className="font-vively text-xs font-bold tracking-wider uppercase">Seoul ⇄ Global</span>
          <span className="text-[10px] text-zinc-400">K-Culture Network</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Collaborate with Top Brands',
    subtitle: 'CURATED DIRECT PARTNERSHIPS',
    description: 'Partner with Korea’s leading trendsetters — Laneige, Gentle Monster, Tamburins, Round Lab, Labab, and luxury Seoul stays with zero middleman friction.',
    badge: 'Exclusive PR & Sponsorships',
    visualIcon: HeartHandshake,
    accentColor: 'bg-black text-white',
    bgBadge: 'bg-[#B5A8DE]/20 text-[#544580]',
    stat: '100% Authentic Brands',
    statSub: 'Direct Headquarters Access',
    graphic: (
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-zinc-100 rounded-full" />
        <div className="relative z-10 grid grid-cols-2 gap-2.5 p-3 bg-white rounded-3xl shadow-md">
          <div className="bg-zinc-50 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-black block">LANEIGE</span>
            <span className="text-[9px] text-zinc-500">Water Bank PR</span>
          </div>
          <div className="bg-zinc-50 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-black block">TAMBURINS</span>
            <span className="text-[9px] text-zinc-500">Egg Perfume</span>
          </div>
          <div className="bg-black p-2.5 rounded-xl text-center text-white">
            <span className="text-[10px] font-bold block text-white">GENTLE</span>
            <span className="text-[8px] text-zinc-300">Monster BOLD</span>
          </div>
          <div className="bg-zinc-50 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-black block">LABAB</span>
            <span className="text-[9px] text-zinc-500">Seongsu Dining</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Content & Campaign Support',
    subtitle: 'DONE-FOR-YOU CAMPAIGN BRIEFS',
    description: 'Never guess what brands want. Get pre-approved moodboards, viral TikTok/Reels sound recommendations, and daily hooks tailored for K-beauty algorithms.',
    badge: 'Viral Hook Playbooks',
    visualIcon: Film,
    accentColor: 'bg-black text-white',
    bgBadge: 'bg-zinc-100 text-black',
    stat: '3.4x Higher Views',
    statSub: 'Tested Hook Formats',
    graphic: (
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-zinc-100 rounded-full" />
        <div className="relative z-10 w-44 bg-white rounded-2xl shadow-md p-3 text-left">
          <div className="flex items-center space-x-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-800">Daily Trend Hook #1</span>
          </div>
          <p className="text-[10px] text-zinc-600 bg-zinc-50 p-2 rounded-lg leading-tight mb-2">
            "I spent 48 hours testing the viral Olive Young sunscreen..."
          </p>
          <div className="flex items-center justify-between text-[9px] text-zinc-500">
            <span>🎵 Magnetic (Chill ver.)</span>
            <span className="text-[#5B4E8C] font-semibold">98% Match</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Monetize Your Influence',
    subtitle: 'SECURE PAYOUTS & PERKS',
    description: 'Get paid promptly via PayPal, Wise, or Direct Bank Transfer. Unlock exclusive salon discounts at Juno Hair, dining vouchers at Labab, and higher commission tiers.',
    badge: 'Affiliate + Flat Payouts',
    visualIcon: Coins,
    accentColor: 'bg-black text-white',
    bgBadge: 'bg-[#B5A8DE]/20 text-[#544580]',
    stat: '$1.4M+ Paid Out',
    statSub: 'To Global Creators',
    graphic: (
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-zinc-100 rounded-full" />
        <div className="relative z-10 w-44 bg-white rounded-2xl shadow-lg p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-zinc-400">Creator Wallet</span>
            <span className="text-[9px] bg-black text-white font-bold px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="text-xl font-vively font-extrabold text-black mb-2">
            $1,240.50
          </div>
          <div className="flex items-center justify-between text-[10px] bg-zinc-50 p-1.5 rounded-lg">
            <span className="text-zinc-600">Juno Hair Perk</span>
            <span className="text-black font-bold">10% OFF</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Grow Your 3D Plant',
    subtitle: 'SEED TO BLOOM EVOLUTION',
    description: 'Nurture your 3D interactive plant companion from a mystical seed into full bloom as you collaborate with brands and complete creator missions.',
    badge: 'Interactive 3D Gamification',
    visualIcon: Sparkles,
    accentColor: 'bg-black text-white',
    bgBadge: 'bg-zinc-100 text-black',
    stat: '4 Evolution Stages',
    statSub: 'Real-time 3D Physics',
    graphic: (
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-[#B5A8DE]/20 rounded-full animate-pulse-subtle" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-black rounded-3xl shadow-xl flex items-center justify-center text-white mb-2">
            <span className="text-3xl">🌱</span>
          </div>
          <span className="font-vively text-xs font-bold text-black">Seed to Flower Evolution</span>
          <span className="text-[10px] text-zinc-500">Water, Sunlight & Brand EXP</span>
        </div>
      </div>
    ),
  },
];

export const WalkthroughCarousel: React.FC<WalkthroughCarouselProps> = ({
  onFinishWalkthrough,
  onOpenAuth,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinishWalkthrough();
      onOpenAuth('signup');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto h-full overflow-hidden shadow-2xl">
      {/* Top Bar: Skip and Slide Indicators */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-6 bg-black'
                  : 'w-2 bg-zinc-200 hover:bg-zinc-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            onFinishWalkthrough();
            onOpenAuth('signup');
          }}
          className="text-xs font-semibold text-zinc-400 hover:text-black transition-colors"
        >
          Skip Intro
        </button>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex flex-col justify-between px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col items-center text-center justify-center"
          >
            {/* Tag Badge */}
            <span
              className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3 ${slide.bgBadge}`}
            >
              {slide.badge}
            </span>

            {/* Visual Graphic Representation */}
            <div className="my-2">{slide.graphic}</div>

            {/* Title & Subtitle */}
            <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase mt-3">
              {slide.subtitle}
            </span>
            <h2 className="font-vively text-2xl font-extrabold text-black mt-1 leading-snug">
              {slide.title}
            </h2>

            {/* Description */}
            <p className="text-xs text-zinc-500 mt-2.5 leading-relaxed max-w-xs">
              {slide.description}
            </p>

            {/* Quick Stat Pill */}
            <div className="mt-4 inline-flex items-center space-x-2 bg-zinc-100 px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#B5A8DE]" />
              <span className="text-xs font-bold text-black">{slide.stat}</span>
              <span className="text-xs text-zinc-400">· {slide.statSub}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="pt-4 pb-6 space-y-3">
          {isLast ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  onFinishWalkthrough();
                  onOpenAuth('signup');
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-black text-white font-bold text-sm shadow-md hover:bg-zinc-800 active:scale-98 transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-[#B5A8DE]" />
              </button>

              <button
                onClick={() => {
                  onFinishWalkthrough();
                  onOpenAuth('signin');
                }}
                className="w-full py-2.5 text-xs text-zinc-500 font-semibold hover:text-black transition-colors"
              >
                Already have an account? <span className="text-black font-bold underline">Sign In</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between space-x-3">
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-black flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="flex-1 h-12 rounded-2xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 text-[#B5A8DE]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
