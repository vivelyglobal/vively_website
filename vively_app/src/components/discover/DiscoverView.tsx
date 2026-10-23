import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ExternalLink, Instagram, Youtube, CheckCircle2, ChevronRight, 
  Sparkles, Award, ArrowUpRight, TrendingUp, BookOpen, Video, Copy, Check
} from 'lucide-react';

interface DiscoverViewProps {
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
  onAwardExp: (task: string, exp: number) => void;
}

export interface CreatorLeaderboardItem {
  rank: number;
  name: string;
  handle: string;
  points: number;
  avatar?: string;
  niche: string;
  followers: string;
  engagement: string;
  nationality: string;
  bio: string;
  topPost: string;
}

// Dynamic Creators Leaderboard (empty state ready for live data)
const TOP_20_CREATORS: CreatorLeaderboardItem[] = [];

// Yellow hand-drawn doodle star icon matching Screenshot 1
const DoodleStarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F5A623"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Outline star */}
    <path d="M12 2.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 2.5z" />
    {/* Inner doodle accent lines */}
    <path d="M12 7l1 2.5 2.5.4-1.8 1.8.4 2.5-2.1-1.1-2.1 1.1.4-2.5-1.8-1.8 2.5-.4L12 7z" stroke="#F8C545" strokeWidth="1.2" />
  </svg>
);

// Purple doodle flower icon for "Who are we?" matching Screenshot 2
const PurpleFlowerIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#B5A8DE"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* 5 Petals */}
    <circle cx="12" cy="7" r="3" />
    <circle cx="16.5" cy="10.5" r="3" />
    <circle cx="15" cy="16" r="3" />
    <circle cx="9" cy="16" r="3" />
    <circle cx="7.5" cy="10.5" r="3" />
    {/* Center */}
    <circle cx="12" cy="12" r="2.2" stroke="#9C8CD0" fill="#F4F1FB" />
  </svg>
);

// Yellow cute flower icon for the 5 bullet pills matching Screenshot 2
const YellowFlowerPillIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="#F7C948"
    stroke="#F0B429"
    strokeWidth="1.2"
    className={className}
  >
    {/* 5-petal flower */}
    <circle cx="12" cy="6.5" r="3.2" />
    <circle cx="17.2" cy="10" r="3.2" />
    <circle cx="15.5" cy="16.2" r="3.2" />
    <circle cx="8.5" cy="16.2" r="3.2" />
    <circle cx="6.8" cy="10" r="3.2" />
    {/* Flower center */}
    <circle cx="12" cy="12" r="2.5" fill="#E2841A" stroke="#E2841A" />
  </svg>
);

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onNotify, onAwardExp }) => {
  // Navigation tabs matching the screenshot: About Us | Top Creators | Newsletter | Tutorials
  const [activeSubTab, setActiveSubTab] = useState<'about' | 'creators' | 'newsletter' | 'tutorials'>('creators');
  const [selectedCreator, setSelectedCreator] = useState<CreatorLeaderboardItem | null>(null);
  const [showTipsModal, setShowTipsModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Swipable Ad Banner state
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // User Profile Optimization Form State
  const [profileHandle, setProfileHandle] = useState<string>('');
  const [profileNiche, setProfileNiche] = useState<string>('');
  const [profileShipping, setProfileShipping] = useState<string>('');
  const [isProfileSaved, setIsProfileSaved] = useState<boolean>(false);

  // Themed swipable ad cards matching Screenshot 1 & 2
  const adSlides = [
    {
      id: 'ad-tips',
      tag: 'TIPS AND TRICKS',
      hasSparkle: true,
      tagColor: 'text-zinc-900',
      headline: 'How to stand out and become a top creator of the month and get more benefits!',
      subtext: 'Scoring criteria, campaign guidelines & exclusive Top 5 perks.',
      buttonText: 'see details >',
      bgColor: '#FFEB95', // Warm sunny pastel yellow from Screenshot 1
      borderColor: '#F6DD7E',
      action: 'tips' as const,
    },
    {
      id: 'ad-profile',
      tag: 'Profile Optimization',
      hasSparkle: false,
      tagColor: 'text-zinc-600',
      headline: 'Fill your profile and get better opportunities',
      subtext: 'Complete your profile to get 3.8% faster approvals and brand deals.',
      buttonText: 'Fill Here!',
      bgColor: '#ECE8F8', // Soft lavender pearl from Screenshot 2
      borderColor: '#DDD6F3',
      action: 'profile' as const,
    },
    {
      id: 'ad-bonus',
      tag: 'CREATOR REWARDS',
      hasSparkle: true,
      tagColor: 'text-emerald-900',
      headline: 'Claim KRW 50,000 bonus on your 3rd verified campaign reel',
      subtext: 'Direct settlement every Friday to your registered creator account.',
      buttonText: 'Claim Bonus >',
      bgColor: '#DEF4E8', // Soft mint pastel
      borderColor: '#C2EBD4',
      action: 'bonus' as const,
    },
    {
      id: 'ad-collabs',
      tag: 'VIP BRAND COLLABS',
      hasSparkle: true,
      tagColor: 'text-rose-900',
      headline: 'New luxury K-Beauty autumn PR boxes just arrived',
      subtext: 'Level 2+ creators receive complimentary skincare sets shipped to door.',
      buttonText: 'View Boxes >',
      bgColor: '#FCE6EC', // Soft blush rose pastel
      borderColor: '#F7CCD7',
      action: 'collabs' as const,
    },
    {
      id: 'ad-spotlight',
      tag: 'GLOBAL REACH',
      hasSparkle: true,
      tagColor: 'text-sky-900',
      headline: 'Get featured on Vively Official with 50K+ creator reach',
      subtext: 'Tag @vively_official on your next review video to be spotlighted.',
      buttonText: 'Learn More >',
      bgColor: '#E2EFFD', // Soft sky blue pastel
      borderColor: '#C3E0FA',
      action: 'spotlight' as const,
    },
  ];

  // Auto-slide carousel every 5.5s unless hovered
  React.useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHovered, adSlides.length]);

  const handleNextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % adSlides.length);
  };

  const handlePrevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + adSlides.length) % adSlides.length);
  };

  // Touch Swipe Handlers
  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      handleNextAd();
    } else if (distance < -40) {
      handlePrevAd();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Mouse Drag Handlers for desktop preview
  const [mouseDownX, setMouseDownX] = useState<number | null>(null);
  const onMouseDownHandler = (e: React.MouseEvent) => {
    setMouseDownX(e.clientX);
  };
  const onMouseUpHandler = (e: React.MouseEvent) => {
    if (mouseDownX === null) return;
    const distance = mouseDownX - e.clientX;
    if (distance > 40) {
      handleNextAd();
    } else if (distance < -40) {
      handlePrevAd();
    }
    setMouseDownX(null);
  };

  const handleAdButtonClick = (action: string) => {
    if (action === 'tips') {
      setShowTipsModal(true);
    } else if (action === 'profile') {
      setShowProfileModal(true);
    } else if (action === 'bonus') {
      onAwardExp('Claimed Creator Milestone Bonus', 30);
      onNotify('Claimed KRW 50,000 Milestone Bonus perk! +30 EXP', 'exp');
    } else if (action === 'collabs') {
      onAwardExp('Unlocked VIP Brand PR Boxes', 20);
      onNotify('VIP Brand Collabs directory unlocked! +20 EXP', 'exp');
    } else if (action === 'spotlight') {
      onAwardExp('Creator Spotlight Guide', 15);
      onNotify('Creator Spotlight submission open! +15 EXP', 'exp');
    }
  };

  const currentSlide = adSlides[currentAdIndex];

  return (
    <div className="pb-24 pt-1 px-4 max-w-md mx-auto select-none">
      {/* Sub Navigation Pills matching Screenshot: [About Us] [Top Creators] [Newsletter] [Tutorials] */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 mb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('about')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'about'
              ? 'bg-[#404040] text-white shadow-xs'
              : 'bg-[#ECEEF2] text-zinc-700 hover:bg-[#E2E5EB]'
          }`}
        >
          About Us
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('creators')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'creators'
              ? 'bg-[#404040] text-white shadow-xs'
              : 'bg-[#ECEEF2] text-zinc-700 hover:bg-[#E2E5EB]'
          }`}
        >
          Top Creators
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('newsletter')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'newsletter'
              ? 'bg-[#404040] text-white shadow-xs'
              : 'bg-[#ECEEF2] text-zinc-700 hover:bg-[#E2E5EB]'
          }`}
        >
          Newsletter
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tutorials')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'tutorials'
              ? 'bg-[#404040] text-white shadow-xs'
              : 'bg-[#ECEEF2] text-zinc-700 hover:bg-[#E2E5EB]'
          }`}
        >
          Tutorials
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TOP CREATORS (Screen 1 in user's image)                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'creators' && (
        <div className="space-y-3.5">
          {/* Swipable Ad Banner ("Swipe Swipe", random theme matching colors, exact same size) */}
          <div
            className="relative rounded-[22px] overflow-hidden p-4 text-zinc-900 border transition-colors duration-300 select-none cursor-grab active:cursor-grabbing h-[144px] flex flex-col justify-between"
            style={{
              backgroundColor: currentSlide.bgColor,
              borderColor: currentSlide.borderColor,
            }}
            onTouchStart={onTouchStartHandler}
            onTouchMove={onTouchMoveHandler}
            onTouchEnd={onTouchEndHandler}
            onMouseDown={onMouseDownHandler}
            onMouseUp={onMouseUpHandler}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Swipe left or right to explore announcements & opportunities"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0.6, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0.6, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full flex flex-col justify-between"
              >
                {/* Banner Header: Left Tag / Right Pagination Dots */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {currentSlide.hasSparkle && (
                      <Sparkles className="w-3.5 h-3.5 text-zinc-900 fill-zinc-900 shrink-0" />
                    )}
                    <span
                      className={`font-black tracking-wider text-xs sm:text-sm uppercase truncate ${currentSlide.tagColor || 'text-zinc-900'}`}
                    >
                      {currentSlide.tag}
                    </span>
                  </div>

                  {/* 3+ Pagination Dots in top right matching Screenshot (•••) */}
                  <div className="flex items-center space-x-1.5 py-0.5 px-1 shrink-0 ml-2">
                    {adSlides.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentAdIndex(idx);
                        }}
                        className={`transition-all rounded-full cursor-pointer ${
                          idx === currentAdIndex
                            ? 'w-2 h-2 bg-zinc-800'
                            : 'w-1.5 h-1.5 bg-zinc-500/40 hover:bg-zinc-600/60'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Middle: Headline (up to 2 lines max) + Single-Line Small Text */}
                <div className="my-auto py-0.5">
                  <h3 className="font-bold text-[13px] sm:text-[13.5px] text-zinc-950 leading-snug line-clamp-2">
                    {currentSlide.headline}
                  </h3>
                  <p className="font-normal text-[11px] sm:text-xs text-zinc-700 leading-tight truncate whitespace-nowrap overflow-hidden mt-1">
                    {currentSlide.subtext}
                  </p>
                </div>

                {/* Bottom: Swipe indicator & Action button */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-zinc-500/85 font-medium tracking-tight">
                    swipe for more ↔
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdButtonClick(currentSlide.action);
                    }}
                    className="bg-white hover:bg-zinc-50 active:scale-95 text-zinc-900 font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-xs transition-all cursor-pointer flex items-center space-x-1 border border-black/5"
                  >
                    <span>{currentSlide.buttonText}</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Section Heading: Doodle Star + "Top Creators of the Month" BELOW Tips and Tricks */}
          <div className="flex items-center space-x-2 pt-1 pb-0.5">
            <DoodleStarIcon className="w-5 h-5 shrink-0" />
            <h2 className="font-bold text-base sm:text-[17px] text-zinc-900 tracking-tight">
              Top Creators of the Month
            </h2>
          </div>

          {/* Top Creators list or empty state */}
          {TOP_20_CREATORS.length === 0 ? (
            <div className="bg-white rounded-[24px] p-7 text-center space-y-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-zinc-100">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-500">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-zinc-900">Leaderboard Updating</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Top creators of the month will be ranked here as creators complete verified campaigns and earn community points.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1 scroll-smooth"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1D5DB transparent' }}
            >
              {TOP_20_CREATORS.map((creator) => (
                <div
                  key={creator.rank}
                  className="bg-white rounded-[20px] px-4 py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center justify-between transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                >
                  {/* Left Side: Name and Handle */}
                  <div className="min-w-0 pr-3">
                    <h3 className="font-bold text-[15px] text-zinc-900 tracking-tight truncate leading-tight">
                      {creator.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-normal mt-0.5 truncate">
                      {creator.handle}
                    </p>
                  </div>

                  {/* Right Side: Points (italic) + View Media Kit */}
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="italic text-zinc-400 font-medium text-sm tracking-tight leading-tight">
                      {creator.points}pts
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCreator(creator)}
                      className="text-[11px] text-zinc-500 hover:text-black font-semibold mt-1 cursor-pointer transition-colors p-0 block hover:underline"
                    >
                      View Media Kit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ABOUT US (Screen 2 in user's image)                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'about' && (
        <div className="space-y-4 pt-1">
          {/* Subheader: Purple flower + "Who are we?" */}
          <div className="flex items-start space-x-2.5">
            <PurpleFlowerIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-base sm:text-[17px] text-zinc-900 leading-tight">
                Who are we?
              </h2>
              <p className="text-xs text-zinc-500 font-normal mt-0.5">
                We connect the influence of global creators to brand growth.
              </p>
            </div>
          </div>

          {/* Section Main Title: Vively: Vivid and Lively */}
          <div className="pt-2">
            <h3 className="font-extrabold text-xl text-zinc-900 tracking-tight">
              <span className="font-bold">Vively:</span> Vivid and Lively
            </h3>

            {/* Quote Block with subtle left vertical border line */}
            <div className="border-l-2 border-zinc-200 pl-3.5 py-0.5 mt-2.5">
              <p className="text-xs text-zinc-600 font-normal leading-relaxed text-justify">
                Vively is a global team connecting creators directly with top-tier Korean brands. We help you collaborate across every format—from short-form content and live commerce to offline campaigns—that resonates with your local audience. Turn your influence into income, build an international portfolio, and scale your channel based on real performance data.
              </p>
            </div>

            {/* Three bold tags spaced horizontally */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-zinc-900 mt-4 px-1">
              <span>Global Members</span>
              <span>Industry Expertise</span>
              <span>Market Understanding</span>
            </div>
          </div>

          {/* 5 White Pills with Yellow Flower Icons */}
          <div className="space-y-2 pt-1">
            {[
              'Foreign-led team',
              '10,000+ Global KOL',
              '500+ Creators residing in Seoul',
              'First validated by local market response',
              'Connecting content, campaign, and e-commerce',
            ].map((pillText, idx) => (
              <div
                key={idx}
                className="bg-white rounded-full py-3 px-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center space-x-3 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              >
                <YellowFlowerPillIcon className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold text-zinc-800 tracking-tight">
                  {pillText}
                </span>
              </div>
            ))}
          </div>

          {/* Visit our Website row */}
          <div className="flex items-center space-x-2 pt-3">
            <span className="text-xs text-zinc-500 font-normal">
              Visit our Website:
            </span>
            <a
              href="https://vivelyglobal.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[#F4F4F6] hover:bg-[#EAEAEA] active:scale-95 text-zinc-900 font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>vivelyglobal.com</span>
              <ExternalLink className="w-3 h-3 text-zinc-400 ml-1" />
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NEWSLETTER                                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'newsletter' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center space-x-2 pb-1">
            <BookOpen className="w-5 h-5 text-black" />
            <h2 className="font-bold text-base text-zinc-900">
              Vively Weekly Radar & Trends
            </h2>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-4 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-zinc-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                Market Report · Oct 2026
              </span>
              <h3 className="font-bold text-sm text-zinc-900 leading-snug">
                Q3 2026 K-Beauty US & SEA Trend Radar
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Sunscreen sticks, cica barrier pads, and dual-phase peptide essences are dominating TikTok shop algorithms. Here is what Korean R&D labs are releasing next.
              </p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-zinc-400 text-[11px]">4 min read</span>
                <button
                  type="button"
                  onClick={() => onNotify('Newsletter saved to your reading list!', 'success')}
                  className="text-black font-bold hover:underline"
                >
                  Read Article &gt;
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-zinc-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                Playbook · Sep 2026
              </span>
              <h3 className="font-bold text-sm text-zinc-900 leading-snug">
                How to Pitch Korean Luxury Brands as a Micro-Creator
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Direct insights from Amorepacific, Gentle Monster, and Tamburins brand marketing directors on what sets pitch emails apart.
              </p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-zinc-400 text-[11px]">6 min read</span>
                <button
                  type="button"
                  onClick={() => onNotify('Newsletter saved to your reading list!', 'success')}
                  className="text-black font-bold hover:underline"
                >
                  Read Article &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TUTORIALS                                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'tutorials' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center space-x-2 pb-1">
            <Video className="w-5 h-5 text-black" />
            <h2 className="font-bold text-base text-zinc-900">
              Creator Masterclasses & Guides
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: 'Filming Clean K-Beauty Swatches (Lighting & Angles)',
                duration: '8 mins',
                level: 'Beginner',
              },
              {
                title: 'Olive Young Haul Editing: Pacing & Subtitle Hooks',
                duration: '12 mins',
                level: 'Intermediate',
              },
              {
                title: 'How to Build an Irresistible Media Kit with Real Data',
                duration: '15 mins',
                level: 'Advanced',
              },
            ].map((tut, i) => (
              <div
                key={i}
                className="bg-white p-3.5 rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center justify-between"
              >
                <div>
                  <span className="text-[9px] font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                    {tut.level} · {tut.duration}
                  </span>
                  <h4 className="font-bold text-xs text-zinc-900 mt-1">
                    {tut.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onNotify(`Starting tutorial: ${tut.title}`, 'info')}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-black hover:text-white flex items-center justify-center text-zinc-600 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Creator Media Kit                                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCreator(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-[26px] shadow-2xl overflow-hidden z-10 p-5 select-none"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Rank #{selectedCreator.rank} · {selectedCreator.points}pts
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCreator(null)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-black">
                  {selectedCreator.name}
                </h3>
                <p className="text-xs text-zinc-400">{selectedCreator.handle}</p>
                <p className="text-xs text-zinc-600 mt-2.5 bg-zinc-50 p-2.5 rounded-xl leading-relaxed">
                  "{selectedCreator.bio}"
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3.5 text-center">
                <div className="bg-[#ECEEF2] p-2 rounded-xl">
                  <span className="text-xs font-bold text-black block">{selectedCreator.followers}</span>
                  <span className="text-[10px] text-zinc-500">Audience</span>
                </div>
                <div className="bg-[#ECEEF2] p-2 rounded-xl">
                  <span className="text-xs font-bold text-black block">{selectedCreator.engagement}</span>
                  <span className="text-[10px] text-zinc-500">Engage Rate</span>
                </div>
                <div className="bg-[#ECEEF2] p-2 rounded-xl">
                  <span className="text-xs font-bold text-black block">{selectedCreator.nationality}</span>
                  <span className="text-[10px] text-zinc-500">Base</span>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-zinc-100">
                <span className="text-[11px] font-bold text-zinc-500 block mb-1">
                  Top Performing Content:
                </span>
                <p className="text-xs text-black font-semibold bg-zinc-50 px-3 py-2 rounded-xl">
                  ⭐ {selectedCreator.topPost}
                </p>
              </div>

              <div className="mt-4 pt-1 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    onNotify(`Collab request sent to ${selectedCreator.name}!`, 'success');
                    setSelectedCreator(null);
                  }}
                  className="w-full py-2.5 bg-black hover:bg-zinc-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Send Collaboration Pitch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: Tips and Tricks Details                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showTipsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTipsModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-[26px] shadow-2xl overflow-hidden z-10 p-5 select-none"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-1.5 bg-[#ffed90] text-zinc-900 font-bold text-xs px-3 py-1 rounded-full border border-[#ffed90]">
                  <Sparkles className="w-3.5 h-3.5 fill-zinc-900 text-zinc-900" />
                  <span>CREATOR GUIDE</span>
                </div>
                <button
                  onClick={() => setShowTipsModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-extrabold text-base text-zinc-900 leading-snug">
                How to Become a Top Creator of the Month
              </h3>

              <div className="space-y-2.5 mt-3 text-xs text-zinc-600 leading-relaxed">
                <div className="bg-[#ffed90]/35 p-3 rounded-xl border border-[#ffed90]">
                  <span className="font-bold text-zinc-900 block mb-0.5">
                    1. Collect as Many Points as You Can
                  </span>
                  <p className="text-zinc-700 leading-normal">
                    Earn creator points through active participation, consistent engagement, and high-quality content. The more points you gather, the higher your rank on the leaderboard!
                  </p>
                </div>

                <div className="bg-[#ffed90]/35 p-3 rounded-xl border border-[#ffed90]">
                  <span className="font-bold text-zinc-900 block mb-0.5">
                    2. Complete All Applied Campaigns
                  </span>
                  <p className="text-zinc-700 leading-normal">
                    Fulfill all deliverables on time for every campaign you participate in. You can apply for up to <strong className="text-zinc-900 font-semibold">3 ongoing campaigns</strong> at a time—complete each one thoroughly to boost your score.
                  </p>
                </div>

                <div className="bg-[#ffed90]/35 p-3 rounded-xl border border-[#ffed90]">
                  <span className="font-bold text-zinc-900 block mb-0.5">
                    3. Direct Contact & Extra Perks for Top 5 Creators
                  </span>
                  <p className="text-zinc-700 leading-normal">
                    At the end of each month, the <strong className="text-zinc-900 font-semibold">Top 5 creators</strong> will be contacted directly by our team to unlock exclusive benefits, premium brand sponsorships, and special rewards!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTipsModal(false);
                  onAwardExp('Viewed Creator Growth Tips', 15);
                  onNotify('Earned +15 EXP for reviewing top creator guide!', 'exp');
                }}
                className="w-full mt-4 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Got it, let's climb!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: Profile Optimization ("Fill Here!" from Ad Carousel)               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-[26px] shadow-2xl overflow-hidden z-10 p-5 select-none"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-1.5 bg-[#ECE8F8] text-zinc-900 font-bold text-xs px-3 py-1 rounded-full border border-[#DDD6F3]">
                  <span>Profile Optimization</span>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-extrabold text-base text-zinc-950 leading-snug">
                Fill your profile and get better opportunities
              </h3>
              <p className="text-xs text-zinc-600 mt-1 leading-normal">
                Complete your profile to get 3.8% faster approvals and higher brand deals.
              </p>

              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={profileHandle}
                    onChange={(e) => setProfileHandle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-400 font-medium"
                    placeholder="@yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Content Niche
                  </label>
                  <input
                    type="text"
                    value={profileNiche}
                    onChange={(e) => setProfileNiche(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-400 font-medium"
                    placeholder="e.g. K-Beauty, Fashion, Lifestyle"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    PR Box Shipping Address (Korea)
                  </label>
                  <input
                    type="text"
                    value={profileShipping}
                    onChange={(e) => setProfileShipping(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-400 font-medium"
                    placeholder="Seoul, District, Street..."
                  />
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileSaved(true);
                    setShowProfileModal(false);
                    onAwardExp('Profile Optimized', 50);
                    onNotify('Profile successfully optimized! +50 EXP awarded', 'exp');
                  }}
                  className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  Save Profile & Claim +50 EXP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
