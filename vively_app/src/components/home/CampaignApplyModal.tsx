import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Calendar, Utensils,
  AlertCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Campaign, UserProfile } from '../../types';
import { formatTargetShort } from '../../data/formatters';
import { UserSilhouette } from '../common/UserSilhouette';

interface CampaignApplyModalProps {
  campaign: Campaign | null;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    campaignId: string, 
    pitchNote: string, 
    sampleVariant: string,
    visitReservation?: { date: string; timeSlot: string }
  ) => void;
}

export const CampaignApplyModal: React.FC<CampaignApplyModalProps> = ({
  campaign,
  userProfile,
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !campaign) return null;

  const isVisitCampaign = Boolean(
    campaign.visitSettings?.isVisitRequired || 
    campaign.category === 'Food/Cafe' || 
    campaign.category === 'Stay'
  );

  // Selected Seeding Variant / Package
  const seedingOptions = campaign.seedingOptions && campaign.seedingOptions.length > 0
    ? campaign.seedingOptions
    : ['Standard PR Seeding Package'];

  const [selectedVariant, setSelectedVariant] = useState(seedingOptions[0]);
  const [pitchNote, setPitchNote] = useState('');
  
  // Base dates from campaign
  const defaultDates = campaign.visitSettings?.availableDates || [];
  const defaultTimeSlots = campaign.visitSettings?.availableTimeSlots || [];

  const [selectedVisitDate, setSelectedVisitDate] = useState<string>(defaultDates[0] || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(defaultTimeSlots[0] || '');

  // Terms Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Swipeable container reference for back & forth controls
  const statsScrollRef = useRef<HTMLDivElement>(null);

  const scrollStats = (direction: 'left' | 'right') => {
    if (statsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      statsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Stats data
  const creatorsCount = campaign.creatorsTarget || campaign.slotsTotal || 30;
  const rewardPoints = campaign.pointsReward || campaign.perksExp || 100;
  const targetNations = formatTargetShort(campaign.targetRegion, campaign.nationality);
  const campaignType = campaign.compensationType === 'Gifted/PR' ? 'Exchange PR' : (campaign.compensationType || 'Exchange PR');

  // D-Day badge calculation based on campaign deadline or daysRemaining (e.g., D-10)
  const { dDayBadge, isUrgent } = useMemo(() => {
    let days = campaign.daysRemaining;
    if (typeof days !== 'number' && campaign.deadline) {
      const match = campaign.deadline.match(/\d+/);
      if (match) {
        days = parseInt(match[0], 10);
      }
    }
    const daysNum = typeof days === 'number' ? days : 10;
    const label = daysNum <= 0 ? 'D-Day' : `D-${daysNum}`;
    const urgent = daysNum <= 10;
    return { dDayBadge: label, isUrgent: urgent };
  }, [campaign.daysRemaining, campaign.deadline]);

  const handleSubmit = () => {
    if (!agreedToTerms) {
      setValidationError('Please agree to the collaboration terms and conditions to proceed.');
      return;
    }
    setValidationError(null);
    onSubmit(
      campaign.id, 
      pitchNote || 'Excited to create authentic, engaging content for this campaign!', 
      selectedVariant,
      isVisitCampaign ? { date: selectedVisitDate, timeSlot: selectedTimeSlot } : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal - Matching Picture 1 & Picture 2 */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Header (Picture 1 with D-day added next to Beauty) */}
        <div className="p-5 sm:p-6 pb-2 bg-white flex items-start justify-between">
          <div className="min-w-0 pr-3">
            <h2 className="font-extrabold text-2xl text-black tracking-tight uppercase">
              {campaign.brandName}
            </h2>
            <p className="text-sm font-normal text-zinc-700 mt-0.5">
              {campaign.title}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-colors bg-[#F3F4F6] ${
              isUrgent ? 'text-red-500' : 'text-emerald-600'
            }`}>
              {dDayBadge}
            </span>
            <span className="bg-[#F3F4F6] text-zinc-600 text-xs px-3.5 py-1.5 rounded-full font-medium">
              {campaign.category === 'K-Beauty' ? 'Beauty' : campaign.category}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-6 pb-6 text-xs select-text">
          {/* Swipeable Stats Section (Slots, Targets, Reward, Type, Deliverable, Deadline with smaller label font) */}
          <div className="border-y border-zinc-100/90 py-3.5 px-5 sm:px-6 relative group">
            <div 
              ref={statsScrollRef}
              className="overflow-x-auto no-scrollbar scroll-smooth flex items-center space-x-7 sm:space-x-9 select-none cursor-grab active:cursor-grabbing touch-pan-x"
              tabIndex={0}
              role="region"
              aria-label="Campaign highlights, swipe back and forth"
            >
              {/* Item 1: Slots */}
              <div className="shrink-0 min-w-[70px]">
                <span className="font-bold text-sm sm:text-[15px] text-black flex items-center space-x-1 whitespace-nowrap">
                  <span>{creatorsCount}</span>
                  <UserSilhouette className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </span>
                <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                  Slots
                </span>
              </div>

              {/* Item 2: Targets */}
              <div className="shrink-0 min-w-[70px]">
                <span className="font-bold text-sm sm:text-[15px] text-black block whitespace-nowrap">
                  {targetNations}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                  Targets
                </span>
              </div>

              {/* Item 3: Reward */}
              <div className="shrink-0 min-w-[70px]">
                <span className="font-bold text-sm sm:text-[15px] text-black block whitespace-nowrap">
                  +{rewardPoints} Points
                </span>
                <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                  Reward
                </span>
              </div>

              {/* Item 4: Type */}
              <div className="shrink-0 min-w-[75px]">
                <span className="font-bold text-sm sm:text-[15px] text-black block whitespace-nowrap">
                  {campaignType}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                  Type
                </span>
              </div>

              {/* Item 5: Deliverable */}
              <div className="shrink-0 min-w-[75px]">
                <span className="font-bold text-sm sm:text-[15px] text-black block whitespace-nowrap">
                  1 Video
                </span>
                <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                  Deliverable
                </span>
              </div>

              {/* Item 6: Deadline */}
              <div className="shrink-0 min-w-[75px]">
                <span className={`font-bold text-sm sm:text-[15px] block whitespace-nowrap ${
                  isUrgent ? 'text-red-500' : 'text-emerald-600'
                }`}>
                  {dDayBadge}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                  Deadline
                </span>
              </div>
            </div>
          </div>

          {/* Dining Visit Reservation Selector (if visit/dining campaign) */}
          {isVisitCampaign && (
            <div className="space-y-3 px-5 sm:px-6">
              <h3 className="font-bold text-base text-black flex items-center space-x-1.5">
                <Utensils className="w-4 h-4 text-black" />
                <span>Select Dining Visit Date & Time</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">Reservation Date</label>
                  <select
                    value={selectedVisitDate}
                    onChange={(e) => setSelectedVisitDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 text-xs font-semibold text-black focus:outline-none"
                  >
                    {defaultDates.map((date) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">Time Slot</label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 text-xs font-semibold text-black focus:outline-none"
                  >
                    {defaultTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Brand Info and Seeding Details (Picture 1) */}
          <div className="space-y-2.5 px-5 sm:px-6">
            <h3 className="font-bold text-base text-black">
              Brand Info and Seeding Details
            </h3>
            <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed font-normal">
              {campaign.brandInfo?.introduction || campaign.shortExplanation || campaign.description || 'Verified brand partnership guidelines and deliverables.'}
            </p>

            {/* Benefits Box */}
            <div className="bg-[#F4F4F6] rounded-2xl p-4 mt-2">
              <span className="text-xs font-bold text-zinc-600 block mb-2">
                Benefits
              </span>
              <div className="bg-white rounded-full px-4 py-3 shadow-2xs text-xs font-bold text-black flex items-center">
                {campaign.productSampleName || campaign.compensationValue || 'Complimentary PR package / Creator benefit'}
              </div>
            </div>
          </div>

          {/* Creator Criteria (Picture 1) */}
          <div className="space-y-2.5 px-5 sm:px-6">
            <h3 className="font-bold text-base text-black">
              Creator Criteria
            </h3>
            <div className="space-y-2 text-xs text-zinc-700 font-normal">
              {(campaign.creatorCriteria && campaign.creatorCriteria.length > 0
                ? campaign.creatorCriteria
                : [
                    'Active content creator passionate about authentic storytelling',
                    `Min ${campaign.minFollowersRequired || 1000}+ followers on Instagram or TikTok`,
                    'Can publish within 10 days of package arrival or visit completion',
                  ]
              ).map((crit, idx) => (
                <div key={idx} className="flex items-center space-x-2.5">
                  <div className="w-4 h-4 rounded-full border border-zinc-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-zinc-600 stroke-[2.5]" />
                  </div>
                  <span>{crit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables and Requirements */}
          <div className="space-y-2.5 px-5 sm:px-6">
            <h3 className="font-bold text-base text-black">
              Deliverables and Requirements
            </h3>
            <p className="text-xs text-zinc-500 font-normal">
              To complete this collaboration, please fulfill the following guidelines:
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-700 font-normal">
              {(campaign.deliverables && campaign.deliverables.length > 0
                ? campaign.deliverables
                : [
                    '1x dedicated Instagram Reel or TikTok Video (30-60s)',
                    'Showcase authentic product demonstration & honest review',
                    `Tag @${campaign.brandName.toLowerCase().replace(/[^a-z0-9]/g, '')} and @vively.global`,
                  ]
              ).map((deliv, idx) => (
                <li key={idx} className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0 mt-1.5" />
                  <span>{deliv}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center space-x-2 pt-1 text-xs">
              <span className="text-zinc-400 font-medium">Collaborator:</span>
              <span className="bg-[#F3F4F6] text-zinc-700 font-bold px-3 py-1.5 rounded-xl">
                @vively.global
              </span>
              <span className="bg-[#F3F4F6] text-zinc-700 font-bold px-3 py-1.5 rounded-xl">
                @{campaign.brandName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
              </span>
            </div>
          </div>

          {/* Collaboration and TnC Requirements (Picture 2) */}
          <div className="space-y-3 px-5 sm:px-6 pt-2">
            <h3 className="font-bold text-base sm:text-lg text-black">
              Collaboration and TnC Requirements
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              By submitting this form, you acknowledge that you have read, understood, and agree to the following terms and conditions for the potential collaboration:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-zinc-800 block mb-0.5">
                  Social Media Follow Requirement
                </span>
                <p className="text-zinc-600 leading-relaxed">
                  You agree to follow our official Instagram account: <strong>@vively.global @vively.jp @scoutlab.kr</strong> prior to the confirmation of the campaign.
                </p>
              </div>

              <div>
                <span className="font-bold text-zinc-800 block mb-0.5">
                  Content Timeline:
                </span>
                <p className="text-zinc-600 leading-relaxed">
                  You agree to publish your dedicated content review within 10 days of package arrival or reservation completion.
                </p>
              </div>

              <div>
                <span className="font-bold text-zinc-800 block mb-0.5">
                  Content Rights:
                </span>
                <p className="text-zinc-600 leading-relaxed">
                  You grant the partner brand non-exclusive organic reposting rights with creator tagging on brand channels.
                </p>
              </div>

              <div>
                <span className="font-bold text-zinc-800 block mb-0.5">
                  Data Privacy and Shipping
                </span>
                <p className="text-zinc-600 leading-relaxed">
                  You agree that your domestic shipping address and contact number will be provided solely to courier logistics for PR package dispatch.
                </p>
              </div>
            </div>

            {/* Checkbox box (Picture 2) */}
            <div
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className="bg-[#F4F4F6] hover:bg-zinc-200/70 rounded-2xl p-3.5 flex items-center space-x-3 cursor-pointer mt-4 select-none transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  agreedToTerms ? 'bg-[#4A4D52] text-white' : 'bg-zinc-300'
                }`}
              >
                {agreedToTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs text-zinc-600 leading-snug">
                I acknowledge that I have read and agree to the campaign deliverables, posting deadlines, and creator guidelines.
              </span>
            </div>

            {validationError && (
              <div className="flex items-center space-x-2 text-rose-600 text-xs font-semibold pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer (Picture 2) */}
        <div className="p-4 sm:p-5 pt-3 bg-white border-t border-zinc-100/90 flex flex-col space-y-2">
          <div className="text-xs text-zinc-500 font-normal px-1">
            Upon post approval:
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-[#F3F4F6] hover:bg-zinc-200 text-black font-bold text-sm transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3.5 rounded-2xl bg-[#4A4D52] hover:bg-[#3B3E42] text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center text-center cursor-pointer active:scale-98"
            >
              Submit Application
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
