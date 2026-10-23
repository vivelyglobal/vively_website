import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Heart, Droplets, Sun, ChevronRight, 
  Copy, Gift, Check, Sprout, Flower2, Lock, Edit2 
} from 'lucide-react';
import { PetState, PetType, VesselExpression, FlowerStamp } from '../../types';
import { VivelyVesselMascot, VESSEL_COLOR_PRESETS } from './VivelyVesselMascot';

interface PetCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  petState: PetState;
  onFeed: () => void;
  onPet: () => void;
  onEquipAccessory: (type: any, id?: string) => void;
  onRenamePet?: (name: string) => void;
  onCompleteMicroTask?: (taskName: string, expReward: number) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
  onSelectPetType?: (petType: PetType) => void;
  onCollectStamp?: (level: number, flowerName: string, rewardPoints: number) => void;
}

export const TIER_PERKS = [
  {
    level: 1,
    title: 'Starter Creator Kit & Community',
    code: 'VIVELY-START',
    description: 'Full access to campaign applications, creator community lounge, and brand pitch templates.',
    unlocked: true,
  },
  {
    level: 2,
    title: '10% Juno Hair Salon Voucher',
    code: 'JUNO-VIVELY10',
    description: 'Valid at all Juno Hair flagship salons in Seoul (Gangnam, Hongdae, Seongsu) for styling & treatment.',
    unlocked: false,
  },
  {
    level: 3,
    title: 'Free Meal Voucher @ Labab',
    code: 'LABAB-VIPMEAL',
    description: 'Complimentary 2-person dinner voucher at Labab Seongsu or Hongdae + sparkling makgeolli.',
    unlocked: false,
  },
  {
    level: 4,
    title: 'VIP Brand Invites & +3% Comm.',
    code: 'VIP-CREATOR-PASS',
    description: 'Priority campaign selection, VIP invitations to Seoul Fashion Week pop-ups & +3% commission booster.',
    unlocked: false,
  },
];

export const FLOWER_STAMPS: FlowerStamp[] = [
  {
    level: 1,
    flowerName: 'Sprout Daisy',
    koreanName: '데이지 꽃도장',
    emoticon: '(✿◠‿◠)',
    color: '#FEF9C3',
    sealColor: '#EAB308',
    meaning: 'Fresh Beginnings & Creator Onboarding',
    rewardPoints: 100,
    bonusTitle: 'Starter Bloom Badge',
  },
  {
    level: 2,
    flowerName: 'Cherry Blossom',
    koreanName: '벚꽃 꽃도장',
    emoticon: '(✿◡‿◡)',
    color: '#FCE7F3',
    sealColor: '#EC4899',
    meaning: 'Seoul Muse & Rising Storyteller',
    rewardPoints: 200,
    bonusTitle: 'Juno Hair 10% Voucher & 2,000 KRW',
  },
  {
    level: 3,
    flowerName: 'Lavender Bell',
    koreanName: '라벤더 꽃도장',
    emoticon: '(◕‿◕✿)',
    color: '#EDE9FE',
    sealColor: '#8B5CF6',
    meaning: 'Aesthetic Trendsetter & Viral Reel Maker',
    rewardPoints: 300,
    bonusTitle: 'Labab VIP Meal Voucher & 3,000 KRW',
  },
  {
    level: 4,
    flowerName: 'Mugunghwa Hibiscus',
    koreanName: '무궁화 꽃도장',
    emoticon: '(✿♥‿♥)',
    color: '#FFE4E6',
    sealColor: '#F43F5E',
    meaning: 'Korea Heritage & Pro Brand Ambassador',
    rewardPoints: 500,
    bonusTitle: 'VIP Pop-Up Invites & +3% Commission',
  },
  {
    level: 5,
    flowerName: 'Golden Sunflower',
    koreanName: '해바라기 꽃도장',
    emoticon: '(★‿★✿)',
    color: '#FEF08A',
    sealColor: '#CA8A04',
    meaning: 'Viral Creator Radiance & Top Club Icon',
    rewardPoints: 800,
    bonusTitle: 'Exclusive Luxury PR Box & 8,000 KRW',
  },
  {
    level: 6,
    flowerName: 'Celestial Lotus',
    koreanName: '연꽃 꽃도장',
    emoticon: '(✿˘◡˘)',
    color: '#E0E7FF',
    sealColor: '#6366F1',
    meaning: 'Iconic Master Creator & Global Spotlight',
    rewardPoints: 1500,
    bonusTitle: 'Vively Hall of Fame & 15,000 KRW',
  },
];

export const PetCompanionModal: React.FC<PetCompanionModalProps> = ({
  isOpen,
  onClose,
  petState,
  onFeed,
  onPet,
  onEquipAccessory,
  onRenamePet,
  onNotify,
  onCollectStamp,
}) => {
  const [activeTab, setActiveTab] = useState<'3d' | 'stamps' | 'style' | 'perks'>('3d');
  const [selectedExpression, setSelectedExpression] = useState<VesselExpression>(petState.expression || 'joyful');
  const [selectedVesselColor, setSelectedVesselColor] = useState<string>(petState.vesselColor || 'white');
  const [isWatering, setIsWatering] = useState(false);
  const [isCaring, setIsCaring] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [stampingLevel, setStampingLevel] = useState<number | null>(null);

  // Plant renaming inline state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempPlantName, setTempPlantName] = useState(petState.name || 'Vively Plant');

  if (!isOpen) return null;

  const collectedStamps = petState.collectedStamps || [1];

  const handleWaterClick = () => {
    setIsWatering(true);
    onFeed();
    setTimeout(() => setIsWatering(false), 2000);
  };

  const handleCareClick = () => {
    setIsCaring(true);
    onPet();
    setTimeout(() => setIsCaring(false), 2000);
  };

  const handleCollectStampClick = (stamp: FlowerStamp) => {
    setStampingLevel(stamp.level);
    setTimeout(() => {
      setStampingLevel(null);
      if (onCollectStamp) {
        onCollectStamp(stamp.level, stamp.flowerName, stamp.rewardPoints);
      }
    }, 600);
  };

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onNotify(`Voucher code "${code}" copied!`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSaveName = () => {
    const trimmed = tempPlantName.trim();
    if (!trimmed) {
      setTempPlantName(petState.name || 'Vively Plant');
      setIsEditingName(false);
      return;
    }
    if (onRenamePet) {
      onRenamePet(trimmed);
    }
    setIsEditingName(false);
  };

  const expPercentage = Math.min(100, Math.round((petState.currentExp / petState.maxExp) * 100));
  const currentVesselPreset = VESSEL_COLOR_PRESETS[selectedVesselColor] || VESSEL_COLOR_PRESETS.white;

  // Check if user has an uncollected stamp for their current level
  const uncollectedCurrentStamp = FLOWER_STAMPS.find(
    (s) => petState.level >= s.level && !collectedStamps.includes(s.level)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Clean Elevated Modal */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              Lv.{petState.level}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 flex-wrap">
                {/* Editable Plant Name */}
                {isEditingName ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveName();
                    }}
                    className="flex items-center space-x-1"
                  >
                    <input
                      type="text"
                      value={tempPlantName}
                      onChange={(e) => setTempPlantName(e.target.value)}
                      onBlur={handleSaveName}
                      autoFocus
                      maxLength={18}
                      className="px-2 py-0.5 text-xs font-bold bg-zinc-100 rounded-lg text-black focus:outline-none focus:ring-1.5 focus:ring-black w-28 sm:w-32"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="p-1 rounded-md bg-black text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Save name"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center space-x-1 min-w-0">
                    <h3
                      onClick={() => setIsEditingName(true)}
                      className="font-vively font-extrabold text-black text-base truncate cursor-pointer hover:opacity-75 flex items-center space-x-1"
                      title="Click to rename your plant"
                    >
                      <span>{petState.name || 'Vively Plant'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-zinc-400 hover:text-black transition-colors cursor-pointer"
                      title="Rename plant"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                  <Sprout className="w-3 h-3 text-emerald-700" />
                  <span>Plant Companion</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Seoul Creator Companion · Interactive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level EXP Progress Bar */}
        <div className="px-5 pb-2">
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="font-medium text-zinc-500">Growth to Level {petState.level + 1}</span>
            <span className="font-bold text-black">{petState.currentExp} / {petState.maxExp} EXP</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${expPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-black rounded-full"
            />
          </div>
        </div>

        {/* Navigation Tabs - 4-Column Grid: Plant | Stamps | Style | Perks (Tasks removed) */}
        <div className="px-4 pt-2.5 grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('3d')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
              activeTab === '3d'
                ? 'bg-black text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
          >
            Plant
          </button>
          <button
            onClick={() => setActiveTab('stamps')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center truncate relative cursor-pointer flex items-center justify-center ${
              activeTab === 'stamps'
                ? 'bg-black text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
          >
            <span>Stamps</span>
            {uncollectedCurrentStamp && (
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 absolute top-1 right-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
              activeTab === 'style'
                ? 'bg-black text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setActiveTab('perks')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
              activeTab === 'perks'
                ? 'bg-black text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
          >
            Perks
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: PLANT COMPANION */}
          {activeTab === '3d' && (
            <div className="space-y-4">
              {/* Flower Stamp Passport Teaser Banner */}
              <div 
                onClick={() => setActiveTab('stamps')}
                className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                  uncollectedCurrentStamp
                    ? 'bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border-pink-200 text-pink-950 shadow-xs'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/60 text-zinc-800'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0 font-bold text-xs">
                    <Flower2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs leading-tight truncate">
                      {uncollectedCurrentStamp
                        ? `Lv.${uncollectedCurrentStamp.level} ${uncollectedCurrentStamp.flowerName} Ready to Collect!`
                        : `Flower Stamp Passport: ${collectedStamps.length}/6 Collected`}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 truncate">
                      {uncollectedCurrentStamp
                        ? 'Tap here to stamp your passport & claim points (✿)'
                        : 'Every level you can collect an exclusive flower stamp.'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
              </div>

              {/* Interactive Stage - Ceramic Sprout Mascot */}
              <div 
                className="relative bg-gradient-to-b from-[#FAF9FD] via-[#F4F2FA] to-[#ECEAF5] rounded-3xl overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-4 border border-zinc-200/50 select-none cursor-pointer group"
                onClick={handleCareClick}
                title="Tap to care & cuddle with your plant companion!"
              >
                {/* Floating Gesture Hint in Top-Left */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-zinc-600 font-medium shadow-xs pointer-events-none flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Tap to care & cuddle</span>
                </div>

                {/* Mood Tag in Top-Right */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-zinc-900 font-bold shadow-xs flex items-center space-x-1.5 pointer-events-none">
                  <Sprout className="w-3 h-3 text-emerald-600" />
                  <span>Budding Flora</span>
                </div>

                {/* Animated Falling Vector Water Droplets when Water Plant is clicked */}
                <AnimatePresence>
                  {isWatering && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                      {[...Array(9)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: -20, opacity: 0, x: 110 + (i - 4) * 24 }}
                          animate={{ y: 240, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 0.85 + (i % 3) * 0.2, repeat: 1, ease: 'easeIn', delay: i * 0.07 }}
                          className="absolute text-sky-500"
                        >
                          <svg className="w-4 h-4 fill-sky-400 text-sky-500 drop-shadow-xs" viewBox="0 0 24 24">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                          </svg>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {/* Animated Warm Golden Sunrays & Hearts when Sunlight & Care is clicked */}
                <AnimatePresence>
                  {isCaring && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: [0.6, 1.4, 1.1], opacity: [0, 0.75, 0] }}
                        transition={{ duration: 1.3 }}
                        className="w-48 h-48 rounded-full bg-gradient-to-r from-amber-300/35 to-rose-300/35 blur-xl"
                      />
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: 20, opacity: 0, scale: 0.5 }}
                          animate={{ 
                            y: -85 - i * 15, 
                            x: (i % 2 === 0 ? 1 : -1) * (20 + i * 14), 
                            opacity: [0, 1, 0], 
                            scale: [0.5, 1.25, 0.8] 
                          }}
                          transition={{ duration: 1.2, delay: i * 0.1 }}
                          className="absolute"
                        >
                          {i % 2 === 0 ? (
                            <Sun className="w-5 h-5 text-amber-500 fill-amber-300 drop-shadow-xs" />
                          ) : (
                            <Heart className="w-4 h-4 text-pink-500 fill-pink-300 drop-shadow-xs" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {/* Hero Mascot: Custom Plant with Chosen Vessel Color & Expression */}
                <motion.div
                  animate={
                    isWatering
                      ? { y: [0, -12, 0, -6, 0], scale: [1, 1.06, 0.97, 1.02, 1] }
                      : isCaring
                      ? { y: [0, -16, 0, -8, 0], scale: [1, 1.08, 0.95, 1.03, 1] }
                      : { y: [0, -4, 0] }
                  }
                  transition={
                    isWatering || isCaring
                      ? { duration: 0.8, ease: 'easeOut' }
                      : { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
                  }
                  className="w-52 h-60 sm:w-60 sm:h-68 flex items-center justify-center relative py-2"
                >
                  <VivelyVesselMascot
                    size="custom"
                    variant="sprout"
                    expression={selectedExpression}
                    vesselColor={petState.vesselColor || selectedVesselColor}
                    animate={true}
                    interactive={false}
                    className="w-full h-full drop-shadow-[0_14px_28px_rgba(0,0,0,0.1)]"
                  />
                </motion.div>

                {/* Action Feedback Overlay Pill */}
                <AnimatePresence>
                  {isWatering && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute bottom-4 bg-sky-600/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-lg z-30"
                    >
                      <Droplets className="w-3.5 h-3.5 text-sky-200" />
                      <span>Watered! +20 Plant EXP (^-^)</span>
                    </motion.div>
                  )}
                  {isCaring && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute bottom-4 bg-amber-500/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-lg z-30"
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-100" />
                      <span>Sunlight & Care! +15 Plant EXP (*^^*)</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Plant Care Interaction Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWaterClick}
                  disabled={isWatering}
                  className="py-3 px-4 rounded-2xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Droplets className="w-4 h-4 text-sky-400" />
                  <span>Water Plant</span>
                  <span className="text-[10px] text-zinc-400 font-normal">+20 EXP</span>
                </button>

                <button
                  onClick={handleCareClick}
                  disabled={isCaring}
                  className="py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Sunlight & Care</span>
                  <span className="text-[10px] text-zinc-500 font-normal">+15 EXP</span>
                </button>
              </div>

              {/* Plant Stats Vitals */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-2xl">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1">
                    <span className="flex items-center space-x-1">
                      <Droplets className="w-3 h-3 text-sky-500" />
                      <span>Hydration & Water</span>
                    </span>
                    <span className="font-bold text-black">{petState.hunger}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${petState.hunger}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1">
                    <span className="flex items-center space-x-1">
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Sunlight & Vitality</span>
                    </span>
                    <span className="font-bold text-black">{petState.happiness}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${petState.happiness}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLOWER STAMPS PASSPORT */}
          {activeTab === 'stamps' && (
            <div className="space-y-3.5">
              {/* Passport Header */}
              <div className="bg-gradient-to-br from-[#FFF5F8] via-[#F8F5FF] to-[#F0FDF4] p-3 sm:p-3.5 rounded-2xl border border-pink-100 flex items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0 font-bold text-xs">
                    <Flower2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs sm:text-sm text-zinc-950 truncate">
                      Flower Stamp Passport (꽃 도장)
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-zinc-600 mt-0.5 leading-tight truncate">
                      Every level you reach, collect an exclusive flower stamp!
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center justify-center">
                  <span className="text-xs font-black text-pink-600 bg-pink-100/90 px-2.5 py-1 rounded-full whitespace-nowrap inline-block shadow-2xs">
                    {collectedStamps.length} / {FLOWER_STAMPS.length}
                  </span>
                </div>
              </div>

              {/* Flower Stamps Grid */}
              <div className="grid grid-cols-2 gap-3">
                {FLOWER_STAMPS.map((stamp) => {
                  const isUnlocked = petState.level >= stamp.level;
                  const isCollected = collectedStamps.includes(stamp.level);
                  const isBeingStamped = stampingLevel === stamp.level;

                  return (
                    <div
                      key={stamp.level}
                      className={`relative rounded-2xl p-3.5 flex flex-col justify-between border transition-all ${
                        isCollected
                          ? 'bg-white border-pink-200/80 shadow-xs'
                          : isUnlocked
                          ? 'bg-amber-50/60 border-amber-300 shadow-sm ring-1 ring-amber-300/60'
                          : 'bg-zinc-50 border-zinc-200/60 opacity-60'
                      }`}
                    >
                      {/* Top Row: Level & Stamp Seal Mark */}
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isCollected
                            ? 'bg-pink-100 text-pink-700'
                            : isUnlocked
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-200 text-zinc-600'
                        }`}>
                          Level {stamp.level}
                        </span>

                        <span className="text-xs font-mono font-bold text-zinc-400">
                          +{stamp.rewardPoints}P
                        </span>
                      </div>

                      {/* Middle: Stamp Visual Icon & Names */}
                      <div className="text-center my-1.5 flex flex-col items-center">
                        <div
                          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center relative transition-transform ${
                            isBeingStamped ? 'scale-125 rotate-6' : ''
                          }`}
                          style={{
                            backgroundColor: isCollected ? stamp.color : isUnlocked ? '#FFFBEB' : '#F4F4F5',
                            border: `2px dashed ${isCollected ? stamp.sealColor : isUnlocked ? '#F59E0B' : '#D4D4D8'}`,
                          }}
                        >
                          <span className="text-xs font-mono font-black select-none text-zinc-800 tracking-tight leading-none">
                            {stamp.emoticon}
                          </span>
                          <Flower2
                            className="w-3.5 h-3.5 mt-1"
                            style={{ color: stamp.sealColor }}
                          />

                          {/* Authentic Inked Red Seal Stamp Overlay if Collected */}
                          {isCollected && (
                            <div className="absolute inset-0 rounded-full border-2 border-pink-500 flex items-center justify-center bg-pink-500/10 rotate-[-12deg]">
                              <span className="text-[8px] font-black text-pink-600 tracking-tighter uppercase">
                                STAMPED
                              </span>
                            </div>
                          )}
                        </div>

                        <h5 className="font-extrabold text-xs text-zinc-900 mt-2">
                          {stamp.flowerName}
                        </h5>
                        <p className="text-[10px] font-medium text-zinc-500 mt-0.5">
                          {stamp.koreanName}
                        </p>
                        <p className="text-[9.5px] text-zinc-400 mt-1 leading-tight line-clamp-1">
                          {stamp.meaning}
                        </p>
                      </div>

                      {/* Bottom Action: Collected vs Collect Stamp vs Locked */}
                      <div className="mt-2 pt-2 border-t border-zinc-100">
                        {isCollected ? (
                          <div className="flex items-center justify-center space-x-1 text-emerald-600 font-bold text-[11px] py-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Collected</span>
                          </div>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleCollectStampClick(stamp)}
                            disabled={isBeingStamped}
                            className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                          >
                            <span>Collect Stamp</span>
                            <span className="text-[11px] font-mono">(✿)</span>
                          </button>
                        ) : (
                          <div className="text-center text-[10px] text-zinc-400 font-medium py-1 flex items-center justify-center space-x-1">
                            <Lock className="w-3 h-3 text-zinc-400" />
                            <span>Unlocks at Lv.{stamp.level}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PLANT STYLE & EXPRESSIONS & VESSEL COLORS */}
          {activeTab === 'style' && (
            <div className="space-y-4">
              {/* Clean Mascot Preview Showcase (Title & text removed as requested) */}
              <div className="bg-gradient-to-b from-[#FAF9FD] via-[#F4F2FA] to-[#ECEAF5] rounded-3xl p-5 border border-zinc-200/60 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs">
                {/* Character preview */}
                <div className="w-32 h-36 sm:w-36 sm:h-40 flex items-center justify-center py-1">
                  <VivelyVesselMascot
                    size="custom"
                    variant="sprout"
                    expression={selectedExpression}
                    vesselColor={selectedVesselColor}
                    animate={true}
                    interactive={false}
                    className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.09)]"
                  />
                </div>
                {/* Subtle current style status badge */}
                <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10.5px] font-medium text-zinc-600 shadow-2xs mt-1 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentVesselPreset.swatch, border: '1px solid #D4D4D8' }} />
                  <span>{currentVesselPreset.name}</span>
                  <span className="text-zinc-300">·</span>
                  <span className="font-bold text-zinc-800 capitalize">{selectedExpression}</span>
                </div>
              </div>

              {/* Ceramic Vessel Color Selector (Replacing bow ribbon) */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-900">
                    Ceramic Vessel Colors
                  </h4>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    Pot Color
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.values(VESSEL_COLOR_PRESETS).map((opt) => {
                    const isSelected = selectedVesselColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedVesselColor(opt.id);
                          onEquipAccessory('vesselColor', opt.id);
                          onNotify(`Vessel ceramic changed to ${opt.name}!`, 'info');
                        }}
                        className={`p-2.5 rounded-2xl flex items-center space-x-2.5 text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-2xs'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200/70'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full shadow-2xs shrink-0 ring-1 ring-black/10"
                          style={{ backgroundColor: opt.swatch }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                            {opt.name}
                          </p>
                          <p className={`text-[9.5px] truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                            {opt.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mascot Face Expressions Selector */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">
                    Face Expressions
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    Kawaii Sheet
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'joyful' as VesselExpression, label: '^ ^ Joyful', desc: 'Arc eyes & open smile' },
                    { id: 'winking' as VesselExpression, label: '^ ~ Wink', desc: 'Playful wink' },
                    { id: 'sparkle' as VesselExpression, label: '✦ ✦ Sparkle', desc: 'Starry eye glow' },
                    { id: 'love' as VesselExpression, label: '♡ ♡ Love', desc: 'Heart eyes' },
                    { id: 'sleepy' as VesselExpression, label: '- - Peaceful', desc: 'Sleepy snooze' },
                    { id: 'cheeky' as VesselExpression, label: '^ o ^ Cheeky', desc: 'Playful smile' },
                  ].map((expr) => {
                    const isSelected = selectedExpression === expr.id;
                    return (
                      <button
                        key={expr.id}
                        type="button"
                        onClick={() => {
                          setSelectedExpression(expr.id);
                          onNotify(`Plant expression changed to ${expr.label}!`, 'info');
                        }}
                        className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-2xs'
                            : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200/70'
                        }`}
                      >
                        <div className="font-extrabold text-[11px]">{expr.label}</div>
                        <div className={`text-[9px] truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                          {expr.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REAL-LIFE PERKS */}
          {activeTab === 'perks' && (
            <div className="space-y-3">
              <div className="bg-zinc-50 p-3 rounded-2xl">
                <div className="flex items-center space-x-2 text-black font-bold text-xs">
                  <Gift className="w-4 h-4 text-[#5B4E8C]" />
                  <span>Real-Life Seoul Creator Perks</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Level up your plant companion to unlock exclusive vouchers at Korea's top flagship salons and dining hotspots.
                </p>
              </div>

              <div className="space-y-2.5">
                {TIER_PERKS.map((perk) => {
                  const isUnlocked = petState.level >= perk.level;
                  return (
                    <div
                      key={perk.level}
                      className={`p-3.5 rounded-2xl transition-all ${
                        isUnlocked
                          ? 'bg-white shadow-xs'
                          : 'bg-zinc-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                isUnlocked
                                  ? 'bg-black text-white'
                                  : 'bg-zinc-200 text-zinc-600'
                              }`}
                            >
                              Level {perk.level}
                            </span>
                            <h5 className="font-bold text-black text-xs">
                              {perk.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            {perk.description}
                          </p>
                        </div>
                      </div>

                      {isUnlocked && (
                        <div className="mt-2.5 pt-2 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-black bg-zinc-100 px-2 py-1 rounded-lg">
                            {perk.code}
                          </span>
                          <button
                            onClick={() => handleCopyVoucher(perk.code)}
                            className="text-[11px] font-bold text-black bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedCode === perk.code ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-black" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-zinc-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
