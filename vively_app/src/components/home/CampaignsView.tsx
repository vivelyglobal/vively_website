import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Heart, Flag, Users, PackageOpen, CheckCircle2, 
  Sparkles, Copy, Check, ExternalLink, ArrowRight, ChevronLeft, 
  Calendar, ShieldCheck, Clock, Gift, Award,
  RotateCw, Share2, Eye
} from 'lucide-react';
import { Campaign, UserProfile, NavigationTab, PetState } from '../../types';
import { VivelyVesselMascot } from '../pet/VivelyVesselMascot';
import { CampaignApplyModal } from './CampaignApplyModal';
import confetti from 'canvas-confetti';

interface CampaignsViewProps {
  campaigns: Campaign[];
  userProfile: UserProfile;
  onApplyCampaign: (
    campaignId: string, 
    pitchNote: string, 
    sampleVariant: string,
    visitReservation?: { date: string; timeSlot: string }
  ) => void;
  onToggleSave: (campaignId: string) => void;
  onOpenPetModal: () => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenWallet?: () => void;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
  onCloseSearch?: () => void;
  petState?: PetState;
  walletBalance?: number;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  userProfile,
  onApplyCampaign,
  onToggleSave,
  onOpenPetModal,
  onNotify,
  onNavigateTab,
  onOpenWallet,
  isSearchOpen = false,
  onCloseSearch,
  petState,
  walletBalance = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Beauty');
  
  // Card Expansion & Paperless Post Unboxing States
  const [expandedCampaign, setExpandedCampaign] = useState<Campaign | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [unboxingReplayKey, setUnboxingReplayKey] = useState(0);
  const [activeModalTab, setActiveModalTab] = useState<'card' | 'details'>('card');

  // Application Modal & Affiliate Modal States
  const [selectedCampaignForModal, setSelectedCampaignForModal] = useState<Campaign | null>(null);
  const [affiliateModalCampaign, setAffiliateModalCampaign] = useState<Campaign | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);

  // Exact categories matching screenshot
  const categories = ['Beauty', 'Food', 'Fashion', 'Lifestyle', 'Stay'];

  // Dynamic creator tasks from applied/approved campaigns (empty state if none applied)
  const appliedList = campaigns.filter((c) => c.status === 'applied' || c.status === 'approved');
  const todayTasks = appliedList.map((camp, idx) => ({
    id: camp.id || `task-${idx}`,
    title: `${camp.brandName} deliverable`,
    color: idx % 2 === 0 ? 'bg-rose-500' : 'bg-[#00A3C4]',
    done: false,
  }));

  // Helper to get formatted target country & flag
  const getTargetCountryInfo = (camp: Campaign) => {
    const reg = (camp.targetRegion || camp.nationality || 'South Korea').toLowerCase();
    if (reg.includes('korea') && (reg.includes('mix') || reg.includes('global') || reg.includes('expat'))) {
      return { name: 'Korea & Expats', flag: '🇰🇷' };
    }
    if (reg.includes('korea') || reg.includes('kr')) {
      return { name: 'South Korea', flag: '🇰🇷' };
    }
    if (reg.includes('japan') || reg.includes('jp')) {
      return { name: 'Japan', flag: '🇯🇵' };
    }
    if (reg.includes('global') || reg.includes('mix')) {
      return { name: 'Global / Mix', flag: '🌐' };
    }
    if (reg.includes('usa') || reg.includes('us')) {
      return { name: 'United States', flag: '🇺🇸' };
    }
    return { name: camp.targetRegion || camp.nationality || 'South Korea', flag: '🇰🇷' };
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      camp.title.toLowerCase().includes(q) ||
      camp.brandName.toLowerCase().includes(q) ||
      camp.description.toLowerCase().includes(q);

    const matchesCategory =
      !selectedCategory ||
      (selectedCategory === 'Beauty' && (camp.category === 'K-Beauty' || camp.category === 'Beauty')) ||
      (selectedCategory === 'Food' && (camp.category === 'Food/Cafe' || camp.category === 'Food')) ||
      camp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenCard = (camp: Campaign) => {
    setExpandedCampaign(camp);
    setIsCardFlipped(false);
    setActiveModalTab('card');
    setUnboxingReplayKey((prev) => prev + 1);
    // Mini celebration sparkle
    confetti({ 
      particleCount: 28, 
      spread: 45, 
      origin: { y: 0.45 },
      colors: ['#B4A7D6', '#E8C5D8', '#C4D8C8', '#FFD1DC'] 
    });
  };

  const handleReplayUnboxing = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsCardFlipped(false);
    setUnboxingReplayKey((prev) => prev + 1);
    confetti({ 
      particleCount: 35, 
      spread: 55, 
      origin: { y: 0.45 },
      colors: ['#B4A7D6', '#E8C5D8', '#C4D8C8', '#FFD1DC'] 
    });
  };

  const handleOpenModal = (camp: Campaign) => {
    setSelectedCampaignForModal(camp);
  };

  const handleOpenAffiliateModal = (camp: Campaign) => {
    setAffiliateModalCampaign(camp);
    setCopiedLink(false);
  };

  const handleJoinAffiliate = (camp: Campaign) => {
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    onNotify(`🎉 Official ${camp.brandName} Affiliator link activated! 10% commission on all sales.`, 'success');
    setAffiliateModalCampaign(null);
  };

  const handleCopyAffiliateLink = (camp: Campaign) => {
    const link = `https://vively.club/r/${(userProfile.displayName || 'creator').toLowerCase()}-${camp.brandName.toLowerCase()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedLink(true);
    onNotify('Affiliate tracking link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleConfirmApplication = (
    campaignId: string,
    pitchNote: string,
    sampleVariant: string,
    visitReservation?: { date: string; timeSlot: string }
  ) => {
    onApplyCampaign(campaignId, pitchNote, sampleVariant, visitReservation);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    setSelectedCampaignForModal(null);
  };

  const handleGoToWallet = () => {
    if (onOpenWallet) {
      onOpenWallet();
    } else if (onNavigateTab) {
      onNavigateTab('profile');
      onNotify('Opening Creator Wallet', 'info');
    }
  };

  return (
    <div className="min-h-full pb-28 pt-1 px-4 max-w-md mx-auto select-none space-y-4">
      {/* Search Input Bar with glassmorphism and search emoticon */}
      <div className="relative group flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none select-none z-10 transition-transform group-focus-within:scale-110" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Campaign and Brand"
          className="w-full pl-9 pr-9 py-2.5 sm:py-3 text-xs sm:text-[13px] rounded-full bg-white/65 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/80 font-medium placeholder:text-zinc-400 text-zinc-900 border border-white/70 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.9)_inset] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-200/60 hover:bg-zinc-300 text-zinc-600 hover:text-black flex items-center justify-center cursor-pointer transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Row: 3D Mascot on Left + Solid Task & Balance Card on Right */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Item 1: 3D Ceramic Sprout Mascot on the left */}
        <div
          onClick={onOpenPetModal}
          className="w-[84px] h-[98px] sm:w-[90px] sm:h-[104px] shrink-0 cursor-pointer active:scale-95 transition-transform flex items-center justify-center self-center"
          title="Vively Mascot · Tap to interact!"
        >
          <VivelyVesselMascot
            size="custom"
            variant="sprout"
            expression={petState?.expression || 'joyful'}
            vesselColor={petState?.vesselColor || 'white'}
            animate={true}
            className="w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.08)]"
          />
        </div>

        {/* Item 2: Unified Bubbly Translucent Glass Card on the right */}
        <div className="bg-white/55 backdrop-blur-md rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_3px_rgba(255,255,255,0.95)] border-[1.5px] border-white/80 overflow-hidden flex-1 min-w-0 transition-all hover:bg-white/60">
          {/* Top: Today's Task in 2 columns */}
          <div
            onClick={() => setTaskDetailModalOpen(true)}
            className="p-3 sm:p-3.5 cursor-pointer hover:bg-white/40 transition-colors"
          >
            <div className="flex items-center space-x-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-700 stroke-[2.2] shrink-0" />
              <h3 className="font-bold text-[14px] sm:text-[14.5px] text-zinc-950 tracking-tight">
                Today’s Task
              </h3>
            </div>

            {/* Tasks or Clean Empty State */}
            {todayTasks.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-2.5 sm:gap-x-3 gap-y-1.5">
                {todayTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center space-x-1.5 text-[11px] sm:text-[11.5px] font-medium text-zinc-900 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.color} shrink-0`} />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] sm:text-[11.5px] text-zinc-500 font-normal py-0.5 truncate">
                No scheduled tasks today · All caught up!
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/70" />

          {/* Bottom: Balance row with blue KRW text and chevron matching Wallet */}
          <div
            onClick={handleGoToWallet}
            className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/50 transition-colors"
            title="Creator Wallet · Tap to view details"
          >
            <div className="text-[11.5px] sm:text-[12px] text-zinc-900 font-normal">
              You have <span className="text-[#1D68BD] font-semibold">KRW {walletBalance.toLocaleString()}</span> Balance
            </div>
            <span className="text-zinc-500 text-[12px] font-normal leading-none select-none ml-2">
              &gt;
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Category Filter Pills */}
      <div className="overflow-x-auto no-scrollbar flex items-center space-x-2 py-1 select-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(isSelected ? '' : cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#40434C] text-white shadow-2xs'
                  : 'bg-white/85 backdrop-blur-xs text-zinc-700 font-semibold shadow-2xs hover:bg-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Section Title matching screenshot */}
      <div className="pt-1">
        <h2 className="font-bold text-sm text-zinc-900 tracking-tight">Available Campaigns</h2>
      </div>

      {/* ========================================================================= */}
      {/* CAMPAIGN CARDS LIST (WITH SHARED ELEMENT TRANSITION `layoutId`)           */}
      {/* Clean White Rounded Box with Soft Shadow Matching Screenshot 100%          */}
      {/* ========================================================================= */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xs border border-white/80 space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <PackageOpen className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900">No Active Campaigns</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            New brand sponsorships, PR seeding drops, and dining experiences will appear here when posted by partner brands.
          </p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-10 bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xs border border-white/80">
          <PackageOpen className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-zinc-800">No campaigns found in this category</p>
          <p className="text-[11px] text-zinc-400 mt-1">Try selecting another category or clearing filters</p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 bg-[#484B54] hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            View All Campaigns
          </button>
        </div>
      ) : (
        /* Single Column Full Width Cards (100% Matching Screenshot) */
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            const isAffiliate = Boolean(camp.isAffiliate);
            const isSaved = userProfile.savedCampaignIds?.includes(camp.id);

            return (
              <motion.div
                key={camp.id}
                layoutId={`campaign-card-${camp.id}`}
                onClick={() => handleOpenCard(camp)}
                className="bg-white rounded-[28px] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-white/80 space-y-3.5 transition-all cursor-pointer hover:shadow-md select-none"
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              >
                {/* Brand / Sample Image Box Matching Screenshot */}
                <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-[#F6F7F9] overflow-hidden flex items-center justify-center select-none">
                  {/* Brand Logo / Artwork in Center */}
                  <motion.div
                    layoutId={`campaign-image-${camp.id}`}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {camp.productSampleImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={camp.productSampleImage}
                          alt={camp.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                          <span className="text-white font-extrabold text-xl tracking-tight drop-shadow-md">
                            {camp.brandName}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase">
                        {camp.brandName}
                      </span>
                    )}
                  </motion.div>

                  {/* Top Right: Bookmark Heart Button matching Screenshot */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(camp.id);
                    }}
                    className="absolute top-3 right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-200/70 hover:bg-zinc-200 active:scale-90 flex items-center justify-center transition-all cursor-pointer shadow-2xs z-10"
                    aria-label="Save campaign"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isSaved ? 'fill-red-500 text-red-500' : 'fill-red-500 text-red-500'
                      }`}
                    />
                  </button>

                  {/* Bottom Right of Image Box: 3h timestamp matching Screenshot 100% */}
                  <span className="absolute bottom-3 right-3 text-xs font-normal text-zinc-400 select-none">
                    {camp.uploadTime || '3h'}
                  </span>
                </div>

                {/* Title & Deadline Header matching Screenshot */}
                <div className="flex items-baseline justify-between pt-0.5">
                  <motion.h3
                    layoutId={`campaign-title-${camp.id}`}
                    className="font-extrabold text-black text-lg sm:text-[19px] tracking-tight leading-tight"
                  >
                    {camp.title}
                  </motion.h3>
                  <span className="text-xs font-bold text-[#E53E3E] shrink-0 ml-2">
                    {camp.daysRemaining ? `D-${camp.daysRemaining}` : 'D-10'}
                  </span>
                </div>

                {/* Filter Pills row matching Screenshot */}
                <div className="overflow-x-auto no-scrollbar flex items-center space-x-1.5 text-xs py-0.5 scroll-smooth select-none touch-pan-x">
                  <span className="shrink-0 whitespace-nowrap bg-[#F2F4F7] text-zinc-700 font-medium px-3 py-1 rounded-full">
                    {camp.category === 'K-Beauty' ? 'Beauty' : camp.category}
                  </span>
                  <span className="shrink-0 whitespace-nowrap bg-[#F2F4F7] text-zinc-700 font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-zinc-400 stroke-[1.8]" />
                    <span>{camp.nationality?.replace(' Nations', '') || 'Mix'}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap bg-[#F2F4F7] text-zinc-700 font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400 stroke-[1.8]" />
                    <span>{camp.creatorsTarget || camp.slotsTotal || 30}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap bg-[#F2F4F7] text-zinc-700 font-medium px-3 py-1 rounded-full">
                    {camp.deliverableSummary || '1 Reel'}
                  </span>
                  <span className="shrink-0 whitespace-nowrap bg-[#F2F4F7] text-zinc-700 font-medium px-3 py-1 rounded-full">
                    +{camp.pointsReward || 100}pts
                  </span>
                </div>

                {/* Description matching Screenshot */}
                <p className="text-xs sm:text-[12.5px] text-zinc-600 font-normal leading-relaxed pt-0.5 line-clamp-2">
                  {camp.shortExplanation || camp.description}
                </p>

                {/* Bottom Action Row with Apply Now matching Screenshot */}
                <div className={`flex items-center ${isAffiliate ? 'justify-between' : 'justify-end'} pt-1`}>
                  {isAffiliate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          localStorage.setItem('vively_open_affiliator_modal', 'true');
                        } catch {}
                        if (onNavigateTab) {
                          onNavigateTab('my-page');
                        }
                      }}
                      className="text-xs font-normal text-zinc-600 underline hover:text-[#7E6CA7] transition-colors cursor-pointer"
                    >
                      Join Affiliate &amp; Earn &gt;
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(camp);
                    }}
                    className="bg-[#484B54] hover:bg-black text-white font-bold text-xs sm:text-[13px] px-6 py-2.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPANDING PAPERLESS POST STYLE UNBOXING ENVELOPE MODAL                     */}
      {/* (1:1 Matched to User's Uploaded Video with Cute Animation & Card Reveal)  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {expandedCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setExpandedCampaign(null)}
          >
            <motion.div
              layoutId={`campaign-card-${expandedCampaign.id}`}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md bg-[#F4F3ED] rounded-[32px] overflow-hidden shadow-2xl max-h-[94vh] flex flex-col border border-zinc-200/60"
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
              {/* Top Navigation Bar Matching Video (← Back Arrow, Preview Pill, Save Heart) */}
              <div className="px-4 pt-3.5 pb-2 flex items-center justify-between z-30">
                {/* Left: Back Button Circle */}
                <button
                  type="button"
                  onClick={() => setExpandedCampaign(null)}
                  className="w-9 h-9 rounded-full bg-white shadow-xs hover:bg-zinc-50 active:scale-90 flex items-center justify-center text-zinc-800 transition-all cursor-pointer"
                  title="Back to campaigns"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Center / Right: Cute Replay / Preview Pill Button matching Video */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleReplayUnboxing}
                    className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 active:scale-95 text-zinc-800 text-xs font-bold rounded-full shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Replay cute unboxing animation"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B4A7D6]" />
                    <span>Preview</span>
                  </button>

                  {/* Save Heart Button */}
                  <button
                    type="button"
                    onClick={() => onToggleSave(expandedCampaign.id)}
                    className="w-9 h-9 rounded-full bg-white shadow-xs hover:bg-zinc-50 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        userProfile.savedCampaignIds?.includes(expandedCampaign.id)
                          ? 'fill-red-500 text-red-500'
                          : 'fill-zinc-300 text-zinc-400'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Scrollable Container */}
              <div className="overflow-y-auto no-scrollbar flex-1 pb-4">
                {/* ------------------------------------------------------------- */}
                {/* STAGE: CUTE ENVELOPE UNBOXING ANIMATION                       */}
                {/* ------------------------------------------------------------- */}
                <div className="relative w-full flex flex-col items-center justify-center pt-2 pb-6 px-4">
                  {/* Cute Floating Particles Animation (Stars, Sparkles, Emoticons) */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                    {[
                      { emoji: '(✿◠‿◠)', x: '18%', y: '25%', delay: 0.1 },
                      { emoji: '♡', x: '82%', y: '22%', delay: 0.25 },
                      { emoji: '✿', x: '12%', y: '65%', delay: 0.35 },
                      { emoji: '★', x: '85%', y: '68%', delay: 0.4 },
                    ].map((item, idx) => (
                      <motion.span
                        key={`${unboxingReplayKey}-${idx}`}
                        initial={{ opacity: 0, y: 15, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 1, 0.9, 0], 
                          y: [-5, -28], 
                          scale: [0.6, 1.2, 0.9] 
                        }}
                        transition={{ 
                          duration: 2.2, 
                          delay: item.delay,
                          repeat: Infinity,
                          repeatDelay: 1.5,
                          ease: 'easeOut'
                        }}
                        style={{ left: item.x, top: item.y }}
                        className="absolute text-lg select-none"
                      >
                        {item.emoji}
                      </motion.span>
                    ))}
                  </div>

                  {/* Envelope Backdrop with Gingham / Checkered Pattern Liner (Matching Video 100%) */}
                  <div className="relative w-full max-w-[285px] sm:max-w-[300px] flex flex-col items-center justify-center">
                    {/* SVG Gingham Open Envelope Flap in Top Left (Exact Video Style) */}
                    <div className="absolute -top-4 -left-4 w-28 h-28 pointer-events-none z-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
                        <defs>
                          {/* Cute Green & Pink Checkered Gingham Liner */}
                          <pattern id="envelope-gingham" width="16" height="16" patternUnits="userSpaceOnUse">
                            <rect width="16" height="16" fill="#F8EAF0" />
                            <rect width="8" height="16" fill="#D6E6DB" opacity="0.8" />
                            <rect width="16" height="8" fill="#EBD2DC" opacity="0.8" />
                            <rect width="8" height="8" fill="#B9CEBF" opacity="0.9" />
                          </pattern>
                        </defs>
                        {/* Open Flap Triangle */}
                        <polygon points="0,0 85,15 15,85" fill="url(#envelope-gingham)" />
                        <polygon points="0,0 85,15 15,85" fill="none" stroke="#C4D5C7" strokeWidth="1" />
                      </svg>
                    </div>

                    {/* Envelope Pocket Base */}
                    <div className="absolute -bottom-3 inset-x-0 h-36 bg-[#D8E1D7] rounded-3xl border border-[#CBD7CA] shadow-inner pointer-events-none z-0">
                      <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-black/8 to-transparent rounded-t-3xl" />
                      <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center">
                        <div className="px-3 py-0.5 rounded-full bg-white/70 backdrop-blur-xs text-[10px] font-bold text-zinc-600 shadow-2xs border border-white/60">
                          Vively Seeding Drop
                        </div>
                      </div>
                    </div>

                    {/* THE CARD SLIDING OUT WITH CUTE ANIMATION (Matching Video) */}
                    <motion.div
                      key={`card-slide-${unboxingReplayKey}`}
                      initial={{ y: 90, scale: 0.88, rotate: -4, opacity: 0 }}
                      animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ 
                        type: 'spring', 
                        damping: 18, 
                        stiffness: 200,
                        delay: 0.1 
                      }}
                      className="relative z-10 w-full"
                    >
                      {/* Floating idle bounce */}
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ 
                          duration: 3.5, 
                          repeat: Infinity, 
                          ease: 'easeInOut' 
                        }}
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="relative w-full aspect-[4/5] bg-white rounded-2xl p-2.5 shadow-[0_18px_38px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06)] border border-zinc-200/90 cursor-pointer overflow-hidden transition-transform group"
                        title="Tap to flip card!"
                      >
                        {/* Card Content: Front vs Back (Flip) */}
                        {!isCardFlipped ? (
                          /* FRONT OF INVITATION CARD (Exact Video Cake / Artwork card style) */
                          <div className="w-full h-full rounded-xl overflow-hidden relative flex flex-col justify-between bg-[#FAFAFA]">
                            {/* Artwork Image Container */}
                            <motion.div 
                              layoutId={`campaign-image-${expandedCampaign.id}`}
                              className="relative w-full flex-1 overflow-hidden bg-zinc-100 flex items-center justify-center"
                            >
                              {expandedCampaign.productSampleImage ? (
                                <img
                                  src={expandedCampaign.productSampleImage}
                                  alt={expandedCampaign.title}
                                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                                  <span className="text-2xl font-black text-black">
                                    {expandedCampaign.brandName}
                                  </span>
                                </div>
                              )}

                              {/* Subtle Foil Corner Badge */}
                              <div className="absolute top-2.5 left-2.5 z-10">
                                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold shadow-2xs">
                                  {expandedCampaign.compensationType === 'Gifted/PR' ? 'Seeding Tier' : 'Paid Collab'}
                                </span>
                              </div>

                              {/* Days Left and Target Country badge on card */}
                              <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1">
                                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center space-x-1 shadow-2xs">
                                  <span>{getTargetCountryInfo(expandedCampaign).flag}</span>
                                  <span>{getTargetCountryInfo(expandedCampaign).name}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-zinc-900 text-[10px] font-bold shadow-2xs">
                                  {expandedCampaign.daysRemaining <= 0 ? 'D-Day' : `${expandedCampaign.daysRemaining}d left`}
                                </span>
                              </div>

                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                              {/* Title overlay on bottom of card artwork */}
                              <div className="absolute bottom-2 inset-x-2 text-white drop-shadow-sm">
                                <motion.h3 
                                  layoutId={`campaign-title-${expandedCampaign.id}`}
                                  className="font-bold text-sm leading-tight truncate"
                                >
                                  {expandedCampaign.title}
                                </motion.h3>
                              </div>
                            </motion.div>

                            {/* Card Footer / Foil Tag */}
                            <div className="p-2 bg-white flex items-center justify-between text-[11px] font-medium text-zinc-600">
                              <span className="truncate">{expandedCampaign.compensationValue}</span>
                              <span className="text-[10px] text-zinc-400 font-bold flex items-center space-x-1 shrink-0">
                                <RotateCw className="w-3 h-3" />
                                <span>Flip</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* BACK OF CARD: Secret PR Package Box Details */
                          <div className="w-full h-full rounded-xl bg-gradient-to-b from-[#FAF8FC] to-white p-3.5 flex flex-col justify-between text-left border border-purple-100/80">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
                                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center">
                                  <Gift className="w-3 h-3 inline mr-1 text-purple-600" />
                                  VIP Seeding Package
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold flex items-center space-x-1">
                                  <RotateCw className="w-3 h-3" />
                                  <span>Flip back</span>
                                </span>
                              </div>

                              <h4 className="font-extrabold text-xs text-zinc-900 leading-snug">
                                {expandedCampaign.productSampleName || expandedCampaign.title}
                              </h4>

                              {/* Star Products */}
                              {expandedCampaign.brandInfo?.starProducts && (
                                <div className="space-y-1 pt-1">
                                  {expandedCampaign.brandInfo.starProducts.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="text-[10.5px] text-zinc-700 flex items-start space-x-1.5 leading-snug">
                                      <span className="text-[#B4A7D6] font-bold">•</span>
                                      <span className="truncate">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10.5px]">
                              <span className="text-zinc-500">Retail Worth:</span>
                              <span className="font-bold text-emerald-600">{expandedCampaign.productValue || expandedCampaign.compensationValue}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* DIRECTLY BELOW CARD: BRAND NAME, HEART & BUTTON (Exact Video) */}
                {/* ------------------------------------------------------------- */}
                <div className="px-5 pt-1 space-y-3">
                  {/* Row 1: Brand Name on Left & Heart on Right (Video Frame 00:01) */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-base sm:text-lg text-zinc-950 tracking-tight">
                          {expandedCampaign.brandName}
                        </span>
                        {expandedCampaign.brandVerified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate max-w-[240px]">
                        {expandedCampaign.title}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSave(expandedCampaign.id)}
                      className="w-10 h-10 rounded-full bg-white shadow-2xs hover:bg-zinc-50 active:scale-90 flex items-center justify-center transition-all cursor-pointer border border-zinc-200/60"
                      title="Save campaign"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          userProfile.savedCampaignIds?.includes(expandedCampaign.id)
                            ? 'fill-red-500 text-red-500'
                            : 'fill-zinc-300 text-zinc-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 2: Prominent Pill Button: "Apply to Campaign" (Video's "Personalize Card" style) */}
                  <button
                    type="button"
                    onClick={() => {
                      const c = expandedCampaign;
                      setExpandedCampaign(null);
                      handleOpenModal(c);
                    }}
                    className="w-full py-3.5 px-6 bg-[#1E1E22] hover:bg-black active:scale-98 text-white font-extrabold text-sm rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>Apply to Campaign</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Navigation Pill Switcher: [Overview Card] | [Details & Timeline] */}
                  <div className="flex items-center justify-center pt-1 pb-1">
                    <div className="flex items-center space-x-1 p-1 bg-zinc-200/70 rounded-full text-xs font-bold text-zinc-600">
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('card')}
                        className={`px-4 py-1 rounded-full transition-all cursor-pointer ${
                          activeModalTab === 'card' ? 'bg-white text-zinc-900 shadow-2xs' : 'hover:text-zinc-900'
                        }`}
                      >
                        Gift Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('details')}
                        className={`px-4 py-1 rounded-full transition-all cursor-pointer ${
                          activeModalTab === 'details' ? 'bg-white text-zinc-900 shadow-2xs' : 'hover:text-zinc-900'
                        }`}
                      >
                        Full Details & Timeline
                      </button>
                    </div>
                  </div>

                  {/* ----------------------------------------------------------- */}
                  {/* EXPANDED CAMPAIGN DETAILS (Criteria, Timeline, Affiliate)    */}
                  {/* ----------------------------------------------------------- */}
                  {activeModalTab === 'details' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-2 text-left"
                    >
                      {/* Short Description */}
                      <div className="p-3.5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Description</span>
                        <p className="text-xs text-zinc-700 mt-1 leading-relaxed">
                          {expandedCampaign.shortExplanation || expandedCampaign.description}
                        </p>
                      </div>

                      {/* Highlights Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs">
                          <span className="text-[10px] text-zinc-400 font-semibold block">Deliverables</span>
                          <span className="font-bold text-zinc-800 mt-0.5 block truncate">
                            {expandedCampaign.deliverableSummary || '1 Reel'}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs">
                          <span className="text-[10px] text-zinc-400 font-semibold block">Reward EXP</span>
                          <span className="font-bold text-[#7E6CA7] mt-0.5 block">
                            +{expandedCampaign.pointsReward || 100} PTS
                          </span>
                        </div>
                      </div>

                      {/* Creator Criteria */}
                      <div className="p-3.5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs space-y-2">
                        <h4 className="font-bold text-xs text-zinc-900 flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-zinc-700" />
                          <span>Creator Requirements</span>
                        </h4>
                        <div className="space-y-1.5 text-xs text-zinc-700">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-zinc-900">Target Country:</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center space-x-1">
                              <span>{getTargetCountryInfo(expandedCampaign).flag}</span>
                              <span>{getTargetCountryInfo(expandedCampaign).name} (Domestic Shipping & Expats)</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-zinc-900">Platforms:</span>
                            <span>Instagram Reels & TikTok</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-zinc-900">Min Followers:</span>
                            <span>{expandedCampaign.minFollowersRequired || 1000}+ followers</span>
                          </div>
                          {expandedCampaign.creatorCriteria && expandedCampaign.creatorCriteria.map((item, i) => (
                            <div key={i} className="flex items-start space-x-1.5 text-[11.5px] text-zinc-600">
                              <span className="text-[#B4A7D6]">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Task Timeline */}
                      {expandedCampaign.timeline && (
                        <div className="p-3.5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs space-y-2">
                          <h4 className="font-bold text-xs text-zinc-900 flex items-center space-x-1.5">
                            <Calendar className="w-4 h-4 text-zinc-700" />
                            <span>Campaign Timeline</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-zinc-50 rounded-xl">
                              <span className="text-[10px] text-zinc-400 font-medium block">Application Date</span>
                              <span className="font-bold text-zinc-800">{expandedCampaign.timeline.applicationDate}</span>
                            </div>
                            <div className="p-2 bg-zinc-50 rounded-xl">
                              <span className="text-[10px] text-zinc-400 font-medium block">Posting Deadline</span>
                              <span className="font-bold text-zinc-800">{expandedCampaign.timeline.endDate}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Affiliate Perks (If Connected) */}
                      {expandedCampaign.isAffiliate && (
                        <div className="p-3.5 bg-gradient-to-r from-[#F5F2FC] to-[#FDF4F8] border border-[#EAE3F7] rounded-2xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-zinc-900 flex items-center space-x-1">
                              <Sparkles className="w-3.5 h-3.5 text-[#7E6CA7]" />
                              <span>Affiliate Program Available</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedCampaign(null);
                              try {
                                localStorage.setItem('vively_open_affiliator_modal', 'true');
                              } catch {}
                              if (onNavigateTab) {
                                onNavigateTab('my-page');
                              }
                            }}
                            className="text-xs font-normal text-zinc-600 underline hover:text-[#7E6CA7] cursor-pointer block"
                          >
                            Join Affiliate &amp; Earn &gt;
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Details Quick Modal */}
      {taskDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-zinc-700 stroke-[2.2]" />
                <h3 className="font-extrabold text-base text-zinc-900">Today’s Schedule & Tasks</h3>
              </div>
              <button
                onClick={() => setTaskDetailModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {todayTasks.length > 0 ? (
                todayTasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2 h-2 rounded-full ${t.color}`} />
                      <span className="text-xs font-bold text-zinc-800">{t.title}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Pending</span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-center space-y-1">
                  <p className="text-xs font-bold text-zinc-800">No scheduled tasks today</p>
                  <p className="text-[11px] text-zinc-500">
                    Apply to brand campaigns to receive PR boxes & schedule visits.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setTaskDetailModalOpen(false);
                if (onNavigateTab) onNavigateTab('profile');
              }}
              className="w-full py-2.5 rounded-xl bg-black text-white font-bold text-xs cursor-pointer hover:bg-zinc-800 transition-all"
            >
              View Full Creator Calendar
            </button>
          </div>
        </div>
      )}

      {/* Campaign Application Modal */}
      {selectedCampaignForModal && (
        <CampaignApplyModal
          campaign={selectedCampaignForModal}
          userProfile={userProfile}
          isOpen={!!selectedCampaignForModal}
          onClose={() => setSelectedCampaignForModal(null)}
          onSubmit={handleConfirmApplication}
        />
      )}

      {/* Affiliate Partner Program Modal */}
      {affiliateModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl space-y-4 border border-zinc-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <div className="flex items-center space-x-2.5">
                <span className="w-8 h-8 rounded-full bg-[#B4A7D6]/20 flex items-center justify-center text-[#7E6CA7]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-950">
                    {affiliateModalCampaign.brandName} Affiliate
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Official Creator Partner Program</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAffiliateModalCampaign(null)}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Commission Perk Banner */}
            <div className="p-3.5 bg-gradient-to-r from-[#F5F2FC] to-[#FDF4F8] border border-[#EAE3F7] rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">Direct Commission Rate</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#B4A7D6] text-white text-xs font-black shadow-2xs">
                  {affiliateModalCampaign.affiliateCommission || '10%'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-snug">
                Earn {affiliateModalCampaign.affiliateCommission || '10%'} cash reward on every verified purchase made through your tracking link or creator coupon code.
              </p>
            </div>

            {/* Creator Tracking Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 block">Your Tracking Link</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  readOnly
                  value={`https://vively.club/r/${(userProfile.displayName || 'creator').toLowerCase()}-${affiliateModalCampaign.brandName.toLowerCase()}`}
                  className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-700 truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopyAffiliateLink(affiliateModalCampaign)}
                  className="px-3 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Follower Discount Code */}
            <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-500 font-medium block text-[10px]">Follower Promo Code:</span>
                <span className="font-mono font-black text-zinc-900 text-sm tracking-wider">
                  {(userProfile.displayName || 'CREATOR').toUpperCase()}{affiliateModalCampaign.affiliateCommission?.replace('%', '') || '10'}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                10% Off for Followers
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleJoinAffiliate(affiliateModalCampaign)}
                className="w-full py-3 px-4 bg-[#B4A7D6] hover:bg-[#A697CE] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Activate Affiliate Partnership</span>
              </button>
              <button
                type="button"
                onClick={() => setAffiliateModalCampaign(null)}
                className="w-full py-2 text-zinc-500 hover:text-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
