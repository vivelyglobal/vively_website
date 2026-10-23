import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, Music, ChevronLeft, ChevronRight, X, 
  MapPin, Calendar as CalendarIcon, Clock, CheckCircle2, 
  DollarSign, Settings, Shield, LogOut, RefreshCw, 
  ArrowUpRight, AlertCircle, Edit3, ExternalLink,
  Headphones, MessageSquare, Sparkles, Copy, Check, Gift,
  Share2, Users, Camera, Upload, Lock, User
} from 'lucide-react';
import { UserProfile, PetState, WalletState, Campaign } from '../../types';
import { VivelyVesselMascot } from '../pet/VivelyVesselMascot';
import confetti from 'canvas-confetti';

interface MyPageViewProps {
  userProfile: UserProfile;
  petState: PetState;
  walletState: WalletState;
  campaigns: Campaign[];
  initialSubTab?: 'campaigns' | 'wallet' | 'management';
  onOpenPetModal: () => void;
  onUpdateProfile?: (updatedProfile: Partial<UserProfile>) => void;
  onUpdateShippingAddress: (newAddress: UserProfile['shippingAddress']) => void;
  onWithdrawFunds: (amount: number, method: string) => void;
  onRestartWalkthrough: () => void;
  onSignOut: () => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
  onOpenCustomerService?: () => void;
}

export const WHITE_BACKGROUND_URL = 'https://i.postimg.cc/prWMfQGF/white-background.png';

// Clean blank photo avatar component (minimalist neutral profile placeholder)
const BlankPhotoAvatar: React.FC<{ size?: string; iconSize?: string; className?: string }> = ({ 
  size = 'w-16 h-16', 
  iconSize = 'w-7 h-7',
  className = '' 
}) => (
  <div 
    className={`${size} rounded-full bg-zinc-100 border border-zinc-200/90 flex items-center justify-center text-zinc-400 shrink-0 shadow-2xs ${className}`}
  >
    <User className={iconSize} />
  </div>
);

export const MyPageView: React.FC<MyPageViewProps> = ({
  userProfile,
  petState,
  walletState,
  campaigns,
  initialSubTab = 'campaigns',
  onOpenPetModal,
  onUpdateProfile,
  onUpdateShippingAddress,
  onWithdrawFunds,
  onRestartWalkthrough,
  onSignOut,
  onNotify,
  onOpenCustomerService,
}) => {
  // Tab Navigation: 'campaigns' | 'wallet' | 'management' (Default: 'campaigns')
  const [activeTab, setActiveTab] = useState<'campaigns' | 'wallet' | 'management'>(initialSubTab);

  // Referral Points Bonus & Stats Tracker (Get 100 pts per new user)
  const [referralPointsBonus, setReferralPointsBonus] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('vively_referral_points_bonus') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [invitedCount, setInvitedCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('vively_referral_invite_count') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [copiedReferralCode, setCopiedReferralCode] = useState(false);

  // Dynamic Creator Points (Base Points + Referral Points)
  const baseCreatorPoints = 0;
  const creatorPoints = baseCreatorPoints + referralPointsBonus;

  // Personal Creator Referral Code (e.g. CREATOR2026)
  const creatorReferralCode = (userProfile.displayName || userProfile.fullName || 'CREATOR')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') + '2026';

  const handleCopyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(creatorReferralCode);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = creatorReferralCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedReferralCode(true);
    confetti({ particleCount: 45, spread: 55, origin: { y: 0.5 } });
    onNotify(`(✿◠‿◠) Referral code "${creatorReferralCode}" copied! Share with new users to get +100 pts each!`, 'success');
    setTimeout(() => setCopiedReferralCode(false), 2400);
  };

  const handleShareReferral = async () => {
    const inviteUrl = `https://vively.app/join?ref=${creatorReferralCode}`;
    const shareMessage = `Hey bestie! (✿◠‿◠) Join Vively with my creator code "${creatorReferralCode}" to get your ₩8,000 welcome bag & PR boxes: ${inviteUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Vively Creator Club',
          text: shareMessage,
          url: inviteUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareMessage);
    } catch {}
    confetti({ particleCount: 30, spread: 50 });
    onNotify(`(✿◡‿◡) Invite link copied to clipboard! Share with your creator friends to earn +100 pts each!`, 'success');
  };

  const handleSimulateNewUser = () => {
    const nextCount = invitedCount + 1;
    const nextBonus = referralPointsBonus + 100;
    setInvitedCount(nextCount);
    setReferralPointsBonus(nextBonus);
    try {
      localStorage.setItem('vively_referral_invite_count', String(nextCount));
      localStorage.setItem('vively_referral_points_bonus', String(nextBonus));
    } catch {}
    confetti({ particleCount: 85, spread: 75, origin: { y: 0.55 } });
    onNotify(`(*^^*) New creator registered with code "${creatorReferralCode}"! +100 pts added to your balance! (Now ${baseCreatorPoints + nextBonus} pts)`, 'success');
  };

  // Modals
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAffiliatorModalOpen, setIsAffiliatorModalOpen] = useState(false);
  const [isCopiedAffiliateLink, setIsCopiedAffiliateLink] = useState(false);
  const [copiedBrandKey, setCopiedBrandKey] = useState<string | null>(null);

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState(userProfile.fullName || '');
  const [editDisplayName, setEditDisplayName] = useState(userProfile.displayName || '');
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editNiche, setEditNiche] = useState(userProfile.niche || '');
  const [editNationality, setEditNationality] = useState(userProfile.country || '');
  const [editCityCountry, setEditCityCountry] = useState(
    userProfile.city && userProfile.country 
      ? `${userProfile.city}, ${userProfile.country}`
      : (userProfile.city || userProfile.country || '')
  );
  const [editInstagram, setEditInstagram] = useState(
    userProfile.socialHandles?.instagram ? userProfile.socialHandles.instagram.replace(/^@/, '') : ''
  );
  const [editTiktok, setEditTiktok] = useState(
    userProfile.socialHandles?.tiktok ? userProfile.socialHandles.tiktok.replace(/^@/, '') : ''
  );
  const [editAvatarUrl, setEditAvatarUrl] = useState(userProfile.avatarUrl || '');

  // Keep form fields synced if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.fullName !== undefined) setEditFullName(userProfile.fullName || '');
      if (userProfile.displayName !== undefined) setEditDisplayName(userProfile.displayName || '');
      if (userProfile.bio !== undefined) setEditBio(userProfile.bio || '');
      if (userProfile.niche !== undefined) setEditNiche(userProfile.niche || '');
      if (userProfile.country !== undefined) setEditNationality(userProfile.country || '');
      if (userProfile.city && userProfile.country) {
        setEditCityCountry(`${userProfile.city}, ${userProfile.country}`);
      } else if (userProfile.country || userProfile.city) {
        setEditCityCountry(userProfile.country || userProfile.city || '');
      } else {
        setEditCityCountry('');
      }
      if (userProfile.socialHandles?.instagram !== undefined) {
        setEditInstagram(userProfile.socialHandles.instagram ? userProfile.socialHandles.instagram.replace(/^@/, '') : '');
      }
      if (userProfile.socialHandles?.tiktok !== undefined) {
        setEditTiktok(userProfile.socialHandles.tiktok ? userProfile.socialHandles.tiktok.replace(/^@/, '') : '');
      }
      if (userProfile.avatarUrl !== undefined) setEditAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanFullName = editFullName.trim();
    const cleanDisplayName = editDisplayName.trim() || (cleanFullName ? cleanFullName.split(' ')[0] : '');
    const cleanInstagram = editInstagram.trim()
      ? (editInstagram.trim().startsWith('@') ? editInstagram.trim() : `@${editInstagram.trim()}`) 
      : '';
    const cleanTiktok = editTiktok.trim()
      ? (editTiktok.trim().startsWith('@') ? editTiktok.trim() : `@${editTiktok.trim()}`) 
      : '';

    const cleanBio = editBio.trim();
    const cleanNiche = editNiche.trim();

    const cityCountryParts = editCityCountry.split(',').map((s) => s.trim()).filter(Boolean);
    const cleanCity = cityCountryParts[0] || '';
    const cleanCountry = cityCountryParts[1] || editNationality.trim() || '';

    const updatedData: Partial<UserProfile> = {
      fullName: cleanFullName,
      displayName: cleanDisplayName,
      bio: cleanBio,
      niche: cleanNiche as any,
      city: cleanCity,
      country: cleanCountry,
      avatarUrl: editAvatarUrl,
      socialHandles: {
        ...userProfile.socialHandles,
        instagram: cleanInstagram,
        tiktok: cleanTiktok,
      },
    };

    if (onUpdateProfile) {
      onUpdateProfile(updatedData);
    }
    confetti({ particleCount: 50, spread: 60 });
    setIsEditProfileModalOpen(false);
    onNotify('Profile changes saved successfully! (✿◠‿◠)', 'success');
  };

  // Affiliator Review & Application State ('idle' | 'under_review' | 'approved')
  const [affiliateStatus, setAffiliateStatus] = useState<'idle' | 'under_review' | 'approved'>(() => {
    try {
      return (localStorage.getItem('vively_affiliate_status') as any) || 'idle';
    } catch {
      return 'idle';
    }
  });

  const handleUpdateAffiliateStatus = (status: 'idle' | 'under_review' | 'approved') => {
    setAffiliateStatus(status);
    try {
      localStorage.setItem('vively_affiliate_status', status);
    } catch {}
  };

  // Automatically trigger Easy Apply modal if navigated from Available Campaigns
  useEffect(() => {
    try {
      if (localStorage.getItem('vively_open_affiliator_modal') === 'true') {
        localStorage.removeItem('vively_open_affiliator_modal');
        setIsAffiliatorModalOpen(true);
      }
    } catch {}
  }, []);

  // Withdrawal form
  const [withdrawAmountKRW, setWithdrawAmountKRW] = useState('10000');
  const [payoutMethod, setPayoutMethod] = useState<'KakaoPay' | 'Toss Bank' | 'Shinhan Bank' | 'PayPal'>('KakaoPay');
  const [payoutAccount, setPayoutAccount] = useState(userProfile.email || '');

  // Shipping address form
  const [editStreet, setEditStreet] = useState(userProfile.shippingAddress.street || '');
  const [editUnit, setEditUnit] = useState(userProfile.shippingAddress.unit || '');
  const [editCity, setEditCity] = useState(userProfile.shippingAddress.city || '');
  const [editPostal, setEditPostal] = useState(userProfile.shippingAddress.postalCode || '');
  const [editCountry, setEditCountry] = useState(userProfile.shippingAddress.country || '');

  // Calendar State for October 2026
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDate();
    return today >= 1 && today <= 31 ? today : 1;
  });

  // Filter applied campaigns
  const appliedCampaigns = campaigns.filter((c) => c.status === 'applied');

  // Dynamic calendar events for October 2026 (populated when user reserves visits or RSVPs to events)
  const calendarEvents: Record<number, { title: string; type: string; time: string; venue: string }> = {};
  appliedCampaigns.forEach((camp) => {
    if (camp.visitReservation?.date) {
      const parts = camp.visitReservation.date.split('-');
      const dayNum = parseInt(parts[2] || parts[0], 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
        calendarEvents[dayNum] = {
          title: `${camp.brandName} - ${camp.title}`,
          type: camp.category || 'Campaign Visit',
          time: camp.visitReservation.timeSlot || 'Scheduled Visit',
          venue: camp.locationAddress || 'Location Confirmed',
        };
      }
    }
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(withdrawAmountKRW, 10);
    if (isNaN(amt) || amt <= 0) {
      onNotify('Please enter a valid KRW amount.', 'info');
      return;
    }
    onWithdrawFunds(amt / 1300, payoutMethod);
    confetti({ particleCount: 50, spread: 60 });
    setIsWithdrawModalOpen(false);
    onNotify(`Withdrawal request for ₩${amt.toLocaleString()} KRW to ${payoutMethod} submitted!`, 'success');
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShippingAddress({
      ...userProfile.shippingAddress,
      street: editStreet,
      unit: editUnit,
      city: editCity,
      postalCode: editPostal,
      country: editCountry,
    });
    setIsAddressModalOpen(false);
    onNotify('Shipping address successfully updated for PR seeding boxes!', 'success');
  };

  return (
    <div className="pb-24 pt-1 px-4 max-w-md mx-auto space-y-4 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER SECTION: PROFILE                                            */}
      {/* ========================================================================= */}
      <div className="bg-transparent pt-1">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => setIsEditProfileModalOpen(true)}
            className="flex items-center space-x-3.5 cursor-pointer group min-w-0 pr-2"
            title="Click to edit profile"
          >
            {/* Blank photo or user's own photo */}
            <div className="relative shrink-0">
              {userProfile.avatarUrl ? (
                <img 
                  src={userProfile.avatarUrl} 
                  alt={userProfile.fullName || 'Creator'} 
                  className="w-16 h-16 rounded-full object-cover ring-1 ring-zinc-200/80 shadow-2xs group-hover:opacity-90 transition-opacity" 
                />
              ) : (
                <BlankPhotoAvatar />
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-zinc-200/90 shadow-xs flex items-center justify-center text-zinc-600 group-hover:text-black transition-colors">
                <Edit3 className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Profile Name, Handle, Location */}
            <div className="space-y-0.5 min-w-0">
              <h2 className="font-extrabold text-lg sm:text-xl text-zinc-900 tracking-tight leading-tight truncate group-hover:text-[#5B4E8C] transition-colors">
                {userProfile.fullName || userProfile.displayName || 'Creator'}
              </h2>
              {userProfile.socialHandles?.instagram ? (
                <p className="text-xs text-zinc-500 font-normal truncate">
                  {userProfile.socialHandles.instagram.startsWith('@') ? userProfile.socialHandles.instagram : `@${userProfile.socialHandles.instagram}`}
                </p>
              ) : (
                <p className="text-xs text-zinc-400 font-normal truncate italic">
                  Tap to add Instagram
                </p>
              )}
              {userProfile.city || userProfile.country ? (
                <p className="text-xs text-zinc-500 font-medium truncate">
                  {userProfile.city && userProfile.country 
                    ? `${userProfile.city}, ${userProfile.country}`
                    : (userProfile.city || userProfile.country)}
                </p>
              ) : (
                <p className="text-xs text-zinc-400 font-medium truncate italic">
                  No location set
                </p>
              )}
            </div>
          </div>

          {/* Quick Edit Profile Button */}
          <button
            type="button"
            onClick={() => setIsEditProfileModalOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 active:scale-95 text-zinc-700 text-xs font-bold rounded-full transition-all border border-zinc-200/90 shadow-2xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Edit</span>
          </button>
        </div>

        {/* Become Affiliator Box (1:1 match to Screenshot 2026-10-03 at 1.58.20 PM) */}
        {affiliateStatus === 'idle' && (
          <div 
            onClick={() => setIsAffiliatorModalOpen(true)}
            className="mt-3.5 bg-white/95 rounded-full sm:rounded-[28px] px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-white/90 flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="min-w-0 pr-2">
              <h3 className="font-extrabold text-[15px] sm:text-base text-zinc-950 tracking-tight leading-snug">
                Become Affiliator? Try Now!
              </h3>
              <p className="text-xs text-zinc-500 font-normal mt-0.5 truncate">
                Earn commission on every brand sale
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-2 bg-[#A9A4D3] hover:bg-[#9B95CB] text-white text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95"
            >
              Easy Apply
            </button>
          </div>
        )}

        {affiliateStatus === 'under_review' && (
          <div 
            onClick={() => setIsAffiliatorModalOpen(true)}
            className="mt-3.5 bg-white/95 rounded-full sm:rounded-[28px] px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-amber-200/90 flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-[15px] sm:text-base text-zinc-950 tracking-tight leading-snug">
                  Become Affiliator? Try Now!
                </h3>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="text-xs text-amber-700 font-medium mt-0.5 truncate">
                History & on-time stats under review
              </p>
            </div>

            <button
              type="button"
              className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              In Review
            </button>
          </div>
        )}

        {affiliateStatus === 'approved' && (
          <div 
            onClick={() => setIsAffiliatorModalOpen(true)}
            className="mt-3.5 bg-white/95 rounded-full sm:rounded-[28px] px-4 sm:px-5 py-2.5 sm:py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-white/90 flex items-center justify-between gap-2 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {/* Solid lime-green dot matching screenshot */}
                <span className="w-2.5 h-2.5 rounded-full bg-[#8CE024] shrink-0 inline-block" />
                <h3 className="font-extrabold text-[13px] sm:text-[15px] text-zinc-950 tracking-tight leading-snug whitespace-nowrap">
                  We Welcome You as an Affiliator!
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-normal mt-0.5 truncate pl-4 sm:pl-4.5 whitespace-nowrap">
                Check client campaign availability
              </p>
            </div>

            <button
              type="button"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#A9A4D3] hover:bg-[#9B95CB] text-white text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              Check Here
            </button>
          </div>
        )}
      </div>

      {/* 2. VIVELY COMPANION MASCOT CARD (Includes moved Points Badge) */}
      <div className="bg-white rounded-[26px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-4 flex items-center space-x-3.5 transition-all">
        {/* Left: Mascot (Vively Vessel Plant) */}
        <div className="shrink-0 flex items-center justify-center">
          <VivelyVesselMascot 
            size="sm" 
            expression={petState.expression || 'joyful'} 
            vesselColor={petState.vesselColor || 'white'} 
            animate={true} 
          />
        </div>

        {/* Center/Right Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-1.5 min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 tracking-tight truncate">
                {petState.name || 'Vively Plant'}
              </h3>
              <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                Lv. {petState.level}
              </span>
              {petState.currentExp > 0 ? (
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full shrink-0">
                  +{petState.currentExp} EXP
                </span>
              ) : (
                <span className="text-[9px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                  Seedling
                </span>
              )}
            </div>

            {/* Moved Creator Points Badge right into the character box */}
            <div className="bg-[#ECEEF2] text-zinc-800 text-xs font-bold px-3 py-1 rounded-full shrink-0 shadow-2xs flex items-center space-x-1 ml-2">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>+{creatorPoints} pts</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 font-normal truncate mt-0.5">
            {petState.level >= 2
              ? 'Active Perk: 10% Juno Hair Salon Voucher'
              : 'Perk unlocks at Level 2 (10% Salon Voucher)'}
          </p>

          <div className="flex items-center justify-between mt-1 pt-0.5">
            <span className="text-[11px] text-zinc-500 font-medium">
              Hydration: {petState.hunger}% | Vitality: {petState.happiness}%
            </span>

            {/* "See me!" Pill Button */}
            <button
              type="button"
              onClick={onOpenPetModal}
              className="px-3.5 py-1 bg-[#404040] hover:bg-black text-white text-[11px] font-bold rounded-full transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              See me!
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2b. REFERRAL CODE & INVITE BESTIE (Exact 1:1 Match to Screenshot)         */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        {/* Header Title above Card */}
        <h3 className="font-extrabold text-[15px] sm:text-base text-zinc-800 tracking-tight pl-1">
          Invite Bestie and Get 100 pts
        </h3>

        {/* White Rounded Card */}
        <div className="bg-white rounded-[26px] border border-zinc-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 space-y-3">
          {/* Subtitle */}
          <p className="text-[13px] sm:text-[13.5px] text-zinc-600 font-normal">
            100 pts for you for every new user who sign up!
          </p>

          {/* Code Box & Copy Code Button Row */}
          <div className="flex items-center gap-2.5">
            {/* Grey Input-style Pill showing Code */}
            <div className="flex-1 bg-[#F4F5F7] rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 flex items-center min-w-0">
              <span className="text-xs sm:text-[13px] font-medium text-zinc-400 tracking-wider truncate select-all">
                {creatorReferralCode}
              </span>
            </div>

            {/* Lavender Muted Purple Copy Code Button */}
            <button
              type="button"
              onClick={handleCopyReferralCode}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#ABA5CE] hover:bg-[#9B95CB] active:scale-95 text-white text-xs sm:text-[13px] font-bold rounded-xl sm:rounded-2xl transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              {copiedReferralCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Invited Count */}
          <div className="pt-0.5">
            <span className="text-xs sm:text-[13px] font-bold text-zinc-700">
              Invited: {invitedCount} Users
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-TAB SEGMENT CONTROL: [Campaigns] [Wallet] [Management]              */}
      {/* ========================================================================= */}
      <div className="bg-[#ECEEF2] p-1 rounded-xl flex items-center text-xs font-semibold max-w-xl mx-auto w-full">
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-white text-zinc-900 font-bold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Campaigns
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'wallet'
              ? 'bg-white text-zinc-900 font-bold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Wallet
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('management')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'management'
              ? 'bg-white text-zinc-900 font-bold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Management
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: WALLET VIEW - FULL WIDTH & PROPORTIONED TO FIT PERFECTLY         */}
      {/* ========================================================================= */}
      {activeTab === 'wallet' && (
        <div className="space-y-3.5 w-full">
          {/* Available for Payout Card - Full Width, Perfectly Proportioned */}
          <div className="bg-black text-white rounded-[26px] p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[175px]">
            {/* Ambient luxury glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-zinc-700/20 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div>
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase block">
                AVAILABLE FOR PAYOUT
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                {walletState?.availableBalance ? `${(walletState.availableBalance * 1300).toLocaleString()} KRW` : '0 KRW'}
              </div>
            </div>

            {/* Bottom Row: Points Remaining (Left) + Action Buttons (Right) */}
            <div className="flex items-end justify-between pt-3 gap-2">
              <div className="shrink-0">
                <span className="text-[11px] text-zinc-400 font-medium block">
                  Points Remaining
                </span>
                <span className="text-base font-extrabold text-white tracking-tight">
                  +{creatorPoints} pts
                </span>
              </div>

              {/* Action Buttons: Withdraw & Details - cleanly fitted without truncation */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="bg-white hover:bg-zinc-100 text-black text-xs font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                >
                  Withdraw
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer border border-zinc-700 active:scale-95 whitespace-nowrap"
                >
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* TOTAL EARNED & PENDING REVIEW: Placed directly below the Available for Payout box */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Total Earned Card */}
            <div className="bg-[#ECEEF2] p-4 rounded-2xl flex flex-col justify-between min-h-[105px]">
              <div>
                <span className="text-[10px] sm:text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Total Earned
                </span>
                <span className="text-base sm:text-lg font-extrabold text-zinc-900 mt-1 block tracking-tight leading-tight">
                  {walletState?.lifetimeEarnings ? `₩${(walletState.lifetimeEarnings * 1300).toLocaleString()} KRW` : '₩0 KRW'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 leading-tight">
                {walletState?.transactions?.filter(t => t.type !== 'withdrawal').length > 0
                  ? `Across ${walletState.transactions.filter(t => t.type !== 'withdrawal').length} completed brand partnerships`
                  : 'No completed partnerships yet'}
              </p>
            </div>

            {/* Pending Review Card */}
            <div className="bg-[#ECEEF2] p-4 rounded-2xl flex flex-col justify-between min-h-[105px]">
              <div>
                <span className="text-[10px] sm:text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Pending Review
                </span>
                <span className="text-base sm:text-lg font-extrabold text-zinc-900 mt-1 block tracking-tight leading-tight">
                  {walletState?.pendingBalance ? `₩${(walletState.pendingBalance * 1300).toLocaleString()} KRW` : '₩0 KRW'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 leading-tight">
                {appliedCampaigns.length > 0
                  ? `${appliedCampaigns.length} campaign deliverables under validation`
                  : '0 campaign deliverables under validation'}
              </p>
            </div>
          </div>

          {/* Referral Program Rewards Box in Wallet Tab */}
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#B4A7D6]/25 flex items-center justify-center text-[#67568C] shrink-0">
                  <Gift className="w-4 h-4 text-[#8C7AB8]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">
                    Referral Bonus Balance
                  </h4>
                  <p className="text-[10.5px] text-zinc-500">
                    +100 pts per new creator registered
                  </p>
                </div>
              </div>

              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full shrink-0">
                +{invitedCount * 100} pts Earned
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#F8F9FA] rounded-2xl p-2.5 px-3.5 border border-zinc-100">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Code:</span>
                <span className="text-xs font-black text-zinc-900 font-mono tracking-wider">{creatorReferralCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyReferralCode}
                className="text-xs font-bold text-[#67568C] hover:text-[#524470] flex items-center space-x-1 cursor-pointer active:scale-95 transition-all"
              >
                {copiedReferralCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: CAMPAIGNS VIEW                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* 1. CALENDAR (FIRST) */}
          <div>
            <h3 className="text-xs font-bold text-zinc-600 tracking-wider uppercase mb-2 pl-0.5">
              CALENDAR
            </h3>

            <div className="rounded-[28px] bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 min-h-[220px]">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                <span className="font-extrabold text-sm text-zinc-900">
                  October 2026
                </span>
                <div className="flex items-center space-x-1">
                  <button 
                    type="button" 
                    className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 cursor-pointer"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 cursor-pointer"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-zinc-400 mb-2">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* October 2026 Dates Grid (Starts on Thursday Oct 1) */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* Empty slots for Sun, Mon, Tue, Wed before Oct 1 */}
                <div className="p-2" />
                <div className="p-2" />
                <div className="p-2" />
                <div className="p-2" />

                {/* Days 1 to 31 */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const hasEvent = !!calendarEvents[day];
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`relative p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-black text-white shadow-xs font-bold'
                          : hasEvent
                          ? 'bg-[#ECEEF2] text-zinc-900 hover:bg-[#E2E5EB]'
                          : 'text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      <span>{day}</span>
                      {hasEvent && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Agenda Detail */}
              {calendarEvents[selectedDay] ? (
                <div className="mt-4 p-3.5 bg-[#F8F9FA] rounded-2xl border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2.5 py-0.5 rounded-full">
                      {calendarEvents[selectedDay].type}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500">
                      Oct {selectedDay}, 2026
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 mt-1.5">
                    {calendarEvents[selectedDay].title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center">
                    <Clock className="w-3 h-3 text-zinc-400 mr-1 shrink-0" />
                    <span>{calendarEvents[selectedDay].time}</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center">
                    <MapPin className="w-3 h-3 text-zinc-400 mr-1 shrink-0" />
                    <span>{calendarEvents[selectedDay].venue}</span>
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-[#F8F9FA] rounded-2xl text-center text-xs text-zinc-400 space-y-1 border border-zinc-100/60">
                  <CalendarIcon className="w-5 h-5 mx-auto text-zinc-300" />
                  <p className="font-semibold text-zinc-600">No upcoming schedule</p>
                  <p className="text-[11px] text-zinc-400">No scheduled activities on Oct {selectedDay}, 2026.</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. APPLIED CAMPAIGN TRACKER (SECOND) */}
          <div>
            <h3 className="text-xs font-bold text-zinc-600 tracking-wider uppercase mb-2 pl-0.5 mt-2">
              APPLIED CAMPAIGN TRACKER
            </h3>

            <div className="rounded-[28px] bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-4 min-h-[90px]">
              {appliedCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {appliedCampaigns.map((camp) => (
                    <div 
                      key={camp.id}
                      className="bg-[#F8F9FA] rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={camp.productSampleImage || camp.brandLogo}
                          alt={camp.brandName}
                          className="w-11 h-11 rounded-xl object-cover ring-1 ring-zinc-200"
                        />
                        <div>
                          <span className="text-xs font-bold text-zinc-900 block truncate max-w-[170px]">
                            {camp.title}
                          </span>
                          <span className="text-[11px] text-zinc-500 block mt-0.5">
                            {camp.brandName} · {camp.compensationValue}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ECEEF2] text-zinc-800 shrink-0">
                        Under Review
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                    <Gift className="w-5 h-5 text-zinc-400" />
                  </div>
                  <h4 className="font-bold text-xs text-zinc-700">No applied campaigns yet</h4>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                    Explore available brand campaigns in the Home tab and apply to receive PR seeding packages.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: MANAGEMENT VIEW                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'management' && (
        <div className="space-y-3.5">
          {/* Creator Profile Summary Card */}
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">
                Creator Profile
              </span>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(true)}
                className="text-xs font-bold text-[#5B4E8C] hover:underline cursor-pointer flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
            <div className="text-xs text-zinc-600 space-y-1">
              <p className="font-semibold text-zinc-900">
                {userProfile.fullName || userProfile.displayName || 'Creator'} {userProfile.niche ? `(${userProfile.niche})` : ''}
              </p>
              {userProfile.bio ? (
                <p className="text-[11.5px] text-zinc-500 leading-relaxed">
                  {userProfile.bio}
                </p>
              ) : (
                <p className="text-[11.5px] text-zinc-400 italic">
                  No creator bio added yet. Click edit profile to add your intro.
                </p>
              )}
              {userProfile.city || userProfile.country ? (
                <p className="text-[11px] text-zinc-400 flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-zinc-400 shrink-0" />
                  <span>{userProfile.city ? `${userProfile.city}, ` : ''}{userProfile.country || ''}</span>
                </p>
              ) : (
                <p className="text-[11px] text-zinc-400 flex items-center italic">
                  <MapPin className="w-3 h-3 mr-1 text-zinc-400 shrink-0" />
                  <span>No location set</span>
                </p>
              )}
            </div>
          </div>

          {/* PR Sample Shipping Address Card */}
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">
                PR Seeding Address
              </span>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-bold text-[#5B4E8C] hover:underline cursor-pointer flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {editStreet}, {editUnit}
              <br />
              {editCity} {editPostal}, {editCountry}
            </p>
            <span className="text-[11px] text-zinc-400 block pt-1">
              Used automatically for brand PR gifting deliveries.
            </span>
          </div>

          {/* Payout Account Card */}
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">
                Payout Destination
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Verified ✓
              </span>
            </div>
            <p className="text-xs text-zinc-600">
              {payoutAccount ? `${payoutMethod}: ${payoutAccount}` : `${payoutMethod}: Connect account in Wallet`}
            </p>
          </div>

          {/* Connected Socials */}
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 block">
                Connected Channels
              </span>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(true)}
                className="text-xs font-bold text-[#5B4E8C] hover:underline cursor-pointer flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FA]">
                <div className="flex items-center space-x-2">
                  <Instagram className="w-4 h-4 text-zinc-700" />
                  <span className="font-semibold text-zinc-800">
                    {userProfile.socialHandles?.instagram || 'Not connected'}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  {userProfile.socialHandles?.instagram ? 'Connected' : 'Tap Edit to add'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FA]">
                <div className="flex items-center space-x-2">
                  <Music className="w-4 h-4 text-zinc-700" />
                  <span className="font-semibold text-zinc-800">
                    {userProfile.socialHandles?.tiktok || 'Not connected'}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  {userProfile.socialHandles?.tiktok ? 'Connected' : 'Tap Edit to add'}
                </span>
              </div>
            </div>
          </div>

          {/* Creator Referral Program Tile in Management */}
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 block">
                Creator Referral Program
              </span>
              <span className="text-[10px] font-bold text-[#67568C] bg-[#B4A7D6]/20 px-2.5 py-0.5 rounded-full">
                +100 pts per new user
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FA] text-xs">
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-[#8C7AB8]" />
                <span className="font-mono font-bold text-zinc-900 tracking-wider">{creatorReferralCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyReferralCode}
                className="text-xs font-bold text-[#67568C] hover:text-[#524470] cursor-pointer flex items-center space-x-1 transition-all"
              >
                {copiedReferralCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug">
              Share your code with other creators. Every new user who registers with your code earns you +100 creator points instantly, and receives an extra ₩3,000 bonus.
            </p>
          </div>

          {/* Customer Service & Live Creator Concierge Card */}
          <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 leading-tight">
                    Customer Service & Support
                  </h3>
                  <div className="flex items-center space-x-1.5 text-[10.5px] text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Concierge Online · Seoul HQ</span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                Fast Response
              </span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Have questions about campaigns, PR deliveries, or collaborations? Contact us directly through Kakao Business or Instagram.
            </p>

            {/* Direct Contact Action */}
            <button
              type="button"
              onClick={onOpenCustomerService}
              className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </button>

            {/* Quick External Channels */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <a
                href="https://pf.kakao.com/_hGDxfX"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2 bg-[#FEE500]/25 hover:bg-[#FEE500]/40 text-zinc-900 font-semibold text-[11px] rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer"
              >
                <span>Kakao Business</span>
              </a>

              <a
                href="https://instagram.com/vively.global"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-[11px] rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer"
              >
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Preferences & Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onRestartWalkthrough}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart App Walkthrough</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. WITHDRAWAL MODAL                                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl z-10 p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                <h3 className="font-extrabold text-sm text-zinc-900">
                  Withdraw Funds
                </h3>
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                    Amount (KRW)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmountKRW}
                      onChange={(e) => setWithdrawAmountKRW(e.target.value)}
                      className="w-full text-lg font-black bg-[#ECEEF2] rounded-2xl px-4 py-2.5 text-zinc-900 focus:outline-none"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-zinc-400">
                      KRW
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Available: 10,000 KRW
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                    Payout Destination
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as any)}
                    className="w-full text-xs font-semibold bg-[#ECEEF2] rounded-2xl px-3 py-2.5 text-zinc-900 focus:outline-none"
                  >
                    <option value="KakaoPay">KakaoPay (Fastest)</option>
                    <option value="Toss Bank">Toss Bank</option>
                    <option value="Shinhan Bank">Shinhan Bank</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-xs"
                >
                  Confirm Payout Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 8. TRANSACTION DETAILS MODAL                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDetailsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl z-10 p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                <h3 className="font-extrabold text-sm text-zinc-900">
                  Payout & Points Details
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {walletState?.transactions && walletState.transactions.length > 0 ? (
                  walletState.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-[#F8F9FA] rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 block">
                          {tx.title}
                        </span>
                        <span className="text-[10px] text-zinc-400">{tx.date} · {tx.status || 'Completed'}</span>
                      </div>
                      <span className={`text-xs font-extrabold ${tx.amount < 0 ? 'text-zinc-500' : 'text-emerald-600'}`}>
                        {tx.amount < 0 ? `-₩${Math.abs(tx.amount * 1300).toLocaleString()}` : `+₩${(tx.amount * 1300).toLocaleString()}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-600">No transactions recorded</p>
                    <p className="text-[11px] text-zinc-400">Payouts and bonuses will be listed here once processed.</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 8b. EDIT PROFILE MODAL (Edit & Change Profile)                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileModalOpen(false)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl z-10 p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar"
              style={{
                backgroundImage: `url(${WHITE_BACKGROUND_URL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-1">
                <h2 className="font-extrabold text-2xl text-black tracking-tight">
                  Edit Profile
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-zinc-100 text-zinc-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-zinc-200/60"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Centered Avatar: Either Blank Photo or User's Own Photo */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <div className="relative group flex items-center justify-center">
                  {editAvatarUrl ? (
                    <img
                      src={editAvatarUrl}
                      alt="Profile"
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-sm ring-2 ring-white/90"
                    />
                  ) : (
                    <BlankPhotoAvatar size="w-28 h-28 sm:w-32 sm:h-32" iconSize="w-12 h-12" />
                  )}

                  {/* Camera Upload Trigger */}
                  <label 
                    htmlFor="custom-avatar-file-input"
                    className="absolute bottom-0 right-1 w-8 h-8 rounded-full bg-black text-white hover:bg-zinc-800 flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-90"
                    title="Upload your photo"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="custom-avatar-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setEditAvatarUrl(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Upload or Blank Photo Controls */}
                <div className="mt-2.5 flex items-center space-x-2">
                  <label
                    htmlFor="custom-avatar-file-input"
                    className="px-3.5 py-1.5 bg-white/90 hover:bg-white border border-zinc-200/80 text-zinc-700 text-xs font-bold rounded-full shadow-2xs cursor-pointer flex items-center space-x-1.5 transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{editAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </label>
                  {editAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl('')}
                      className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95 border border-zinc-200/50"
                    >
                      Use Blank Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Form Body Matching Screenshot 2 */}
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                {/* Row 1: Full Name & Display Name */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="font-extrabold text-sm text-zinc-950 block leading-tight">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full mt-1.5 px-3.5 py-2.5 bg-white/80 focus:bg-white rounded-2xl text-zinc-900 text-xs sm:text-[13px] font-medium border border-zinc-200/70 focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-sm text-zinc-950 block leading-tight">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      placeholder="Your Display Name"
                      className="w-full mt-1.5 px-3.5 py-2.5 bg-white/80 focus:bg-white rounded-2xl text-zinc-900 text-xs sm:text-[13px] font-medium border border-zinc-200/70 focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Row 2: Creator Bio */}
                <div>
                  <label className="font-extrabold text-sm text-zinc-950 block leading-tight">
                    Creator Bio
                  </label>
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Your Bio"
                    className="w-full mt-1.5 px-3.5 py-2.5 bg-white/80 focus:bg-white rounded-2xl text-zinc-900 text-xs sm:text-[13px] font-medium border border-zinc-200/70 focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>

                {/* Row 3: Primary Niche */}
                <div>
                  <label className="font-extrabold text-sm text-zinc-950 block leading-tight">
                    Primary Niche
                  </label>
                  <input
                    type="text"
                    value={editNiche}
                    onChange={(e) => setEditNiche(e.target.value)}
                    placeholder="Your Multiple NIche Type"
                    className="w-full mt-1.5 px-3.5 py-2.5 bg-white/80 focus:bg-white rounded-2xl text-zinc-900 text-xs sm:text-[13px] font-medium border border-zinc-200/70 focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>

                {/* Row 4: Nationality & City, Country */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="font-extrabold text-sm text-zinc-950 block leading-tight">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={editNationality}
                      onChange={(e) => setEditNationality(e.target.value)}
                      placeholder="Your Nationality"
                      className="w-full mt-1.5 px-3.5 py-2.5 bg-white/80 focus:bg-white rounded-2xl text-zinc-900 text-xs sm:text-[13px] font-medium border border-zinc-200/70 focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-sm text-zinc-950 block leading-tight">
                      City, Country
                    </label>
                    <input
                      type="text"
                      value={editCityCountry}
                      onChange={(e) => setEditCityCountry(e.target.value)}
                      placeholder="Your City, Country"
                      className="w-full mt-1.5 px-3.5 py-2.5 bg-white/80 focus:bg-white rounded-2xl text-zinc-900 text-xs sm:text-[13px] font-medium border border-zinc-200/70 focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Row 5: Connected Social Channels */}
                <div className="pt-1">
                  <label className="font-extrabold text-sm text-zinc-950 block leading-tight mb-2">
                    Connected Social Channels
                  </label>
                  <div className="space-y-2">
                    {/* Instagram */}
                    <div className="flex items-center bg-white/80 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/70 rounded-2xl px-3.5 py-2 transition-all shadow-2xs">
                      <span className="text-zinc-700 font-bold text-xs select-none mr-1">@</span>
                      <input
                        type="text"
                        value={editInstagram}
                        onChange={(e) => setEditInstagram(e.target.value.replace(/^@/, ''))}
                        placeholder="yourinstagramid"
                        className="flex-1 bg-transparent text-zinc-900 text-xs sm:text-[13px] font-medium focus:outline-none placeholder:text-zinc-400"
                      />
                    </div>

                    {/* TikTok */}
                    <div className="flex items-center bg-white/80 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/70 rounded-2xl px-3.5 py-2 transition-all shadow-2xs">
                      <span className="text-zinc-700 font-bold text-xs select-none mr-1">@</span>
                      <input
                        type="text"
                        value={editTiktok}
                        onChange={(e) => setEditTiktok(e.target.value.replace(/^@/, ''))}
                        placeholder="yourtiktokid"
                        className="flex-1 bg-transparent text-zinc-900 text-xs sm:text-[13px] font-medium focus:outline-none placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center space-x-2.5">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-black hover:bg-zinc-800 text-white font-extrabold rounded-2xl text-xs sm:text-[13px] transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditProfileModalOpen(false)}
                    className="py-3.5 px-5 bg-white/90 hover:bg-zinc-100 text-zinc-700 font-bold rounded-2xl text-xs sm:text-[13px] transition-all cursor-pointer border border-zinc-200/80 shadow-2xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 9. EDIT SHIPPING ADDRESS MODAL                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl z-10 p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                <h3 className="font-extrabold text-sm text-zinc-900">
                  Edit PR Sample Shipping Address
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={editStreet}
                    onChange={(e) => setEditStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-[#ECEEF2] rounded-xl text-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                    Unit / Apartment
                  </label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#ECEEF2] rounded-xl text-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 bg-[#ECEEF2] rounded-xl text-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={editPostal}
                      onChange={(e) => setEditPostal(e.target.value)}
                      className="w-full px-3 py-2 bg-[#ECEEF2] rounded-xl text-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer mt-2"
                >
                  Save Address
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 5. BECOME AFFILIATOR PROGRAM & REVIEW (검토) MODAL                   */}
        {/* ===================================================================== */}
        {isAffiliatorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-white rounded-[32px] p-5 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsAffiliatorModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* ------------------------------------------------------------- */}
              {/* STATE 1: EASY APPLY (BEFORE SUBMITTING)                       */}
              {/* ------------------------------------------------------------- */}
              {affiliateStatus === 'idle' && (
                <div className="space-y-4 pt-1">
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-13 h-13 bg-gradient-to-tr from-[#EBE8F7] to-[#F5ECF3] rounded-2xl mx-auto flex items-center justify-center shadow-xs mb-2.5">
                      <Sparkles className="w-6 h-6 text-[#7E6CA7] fill-[#B4A7D6]" />
                    </div>
                    <h3 className="font-extrabold text-lg text-zinc-950 tracking-tight">
                      Easy Apply: Creator Affiliator
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      We review your campaign history & performance to ensure quality before activating your 10% commission.
                    </p>
                  </div>

                  {/* Auto-Evaluated History & Quality Profile Card */}
                  <div className="bg-[#F8F9FC] border border-zinc-200/80 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Auto-Fetched Profile Criteria
                      </span>
                      <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {appliedCampaigns.length >= 3 ? 'Tier A Creator' : appliedCampaigns.length > 0 ? 'Rising Creator' : 'New Creator'}
                      </span>
                    </div>

                    {/* Criteria 1: How much campaigns they did */}
                    <div className="flex items-start justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-900 block">Completed Campaigns</span>
                        <span className="text-[11px] text-zinc-500">
                          {appliedCampaigns.length > 0 
                            ? appliedCampaigns.map(c => c.brandName).join(', ') 
                            : 'No applied campaigns yet'}
                        </span>
                      </div>
                      <span className={`text-right shrink-0 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        appliedCampaigns.length > 0 
                          ? 'text-emerald-600 bg-emerald-50' 
                          : 'text-zinc-500 bg-zinc-100'
                      }`}>
                        {appliedCampaigns.length > 0 
                          ? `${appliedCampaigns.length} Active` 
                          : '0 Applied'}
                      </span>
                    </div>

                    {/* Criteria 2: Delivery */}
                    <div className="flex items-start justify-between text-xs pt-1 border-t border-zinc-200/40">
                      <div>
                        <span className="font-bold text-zinc-900 block">On-Time Content Delivery</span>
                        <span className="text-[11px] text-zinc-500">Reel deadline adherence record</span>
                      </div>
                      <span className={`text-right shrink-0 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        appliedCampaigns.length > 0
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-zinc-500 bg-zinc-100'
                      }`}>
                        {appliedCampaigns.length > 0 ? '100% Punctual' : 'No records yet'}
                      </span>
                    </div>

                    {/* Criteria 3: Points */}
                    <div className="flex items-start justify-between text-xs pt-1 border-t border-zinc-200/40">
                      <div>
                        <span className="font-bold text-zinc-900 block">Creator Points & Level</span>
                        <span className="text-[11px] text-zinc-500">Quality score & trust rating</span>
                      </div>
                      <span className="text-right shrink-0 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-[11px]">
                        +{creatorPoints} pts (Lv. {petState.level})
                      </span>
                    </div>

                    {/* Criteria 4: Connected Channels */}
                    <div className="flex items-start justify-between text-xs pt-1 border-t border-zinc-200/40">
                      <div>
                        <span className="font-bold text-zinc-900 block">Verified Handles</span>
                        <span className="text-[11px] text-zinc-500">Instagram & TikTok</span>
                      </div>
                      <span className="text-right shrink-0 font-medium text-zinc-700 text-[11px]">
                        {userProfile.socialHandles?.instagram || 'None linked'}
                      </span>
                    </div>
                  </div>

                  {/* Review Notice */}
                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-[11px] text-purple-900 leading-relaxed">
                    <span className="font-bold block mb-0.5">🔍 Vively Review Policy</span>
                    We grant affiliate partnerships only to proven, punctual creators who follow community guidelines. Applications are verified within 2-4 hours.
                  </div>

                  {/* Action: Submit for Review */}
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateAffiliateStatus('under_review');
                      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
                      if (onNotify) {
                        onNotify('🎉 Application submitted for review! Our team will evaluate your profile history.', 'success');
                      }
                    }}
                    className="w-full py-3.5 bg-[#A9A4D3] hover:bg-[#9B95CB] text-white font-extrabold rounded-2xl text-xs sm:text-[13px] transition-all shadow-[0_6px_20px_rgba(169,164,211,0.4)] cursor-pointer active:scale-98"
                  >
                    Submit Easy Apply for Review
                  </button>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STATE 2: UNDER REVIEW                                         */}
              {/* ------------------------------------------------------------- */}
              {affiliateStatus === 'under_review' && (
                <div className="space-y-4 pt-1 text-center">
                  <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                    <Clock className="w-7 h-7 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5">
                      Status: Under Review
                    </span>
                    <h3 className="font-extrabold text-lg text-zinc-950 tracking-tight">
                      Application Under Review
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Our team is currently reviewing your completed campaigns and on-time posting track record.
                    </p>
                  </div>

                  {/* Review Step Progress */}
                  <div className="bg-[#FAF9FD] border border-zinc-200/80 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex items-center space-x-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </span>
                      <span className="font-semibold text-zinc-900">Easy Apply Data Submitted</span>
                    </div>

                    <div className="flex items-center space-x-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] animate-pulse">
                        ⏳
                      </span>
                      <span className="font-bold text-amber-900">
                        Admin Content & Punctuality Review (In Progress · 2-4 hrs)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2.5 text-xs opacity-60">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-[10px]">
                        3
                      </span>
                      <span className="font-medium text-zinc-600">Client Affiliate Activation</span>
                    </div>
                  </div>

                  {/* Admin Fast-Track Simulation for Demo */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateAffiliateStatus('approved');
                        confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
                        if (onNotify) {
                          onNotify('🎉 Review complete! Approved as an official Vively Affiliator.', 'success');
                        }
                      }}
                      className="w-full py-3 bg-[#404040] hover:bg-black text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-xs active:scale-98"
                    >
                      ⚡ [Demo] Approve Application (Instant Approval)
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAffiliatorModalOpen(false)}
                      className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-2xl text-xs transition-all cursor-pointer"
                    >
                      Close & Check Back Later
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STATE 3: CHECK AVAILABILITY - CLIENT AFFILIATE PROGRAMS       */}
              {/* ------------------------------------------------------------- */}
              {affiliateStatus === 'approved' && (
                <div className="space-y-4 pt-1">
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-13 h-13 bg-emerald-50 border border-emerald-200/80 rounded-2xl mx-auto flex items-center justify-center shadow-xs mb-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Official Affiliator Active</span>
                    </div>
                    <h3 className="font-extrabold text-lg text-zinc-950 tracking-tight">
                      Client Affiliate Availability
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Partnership eligibility is tied to your content campaign participation.
                    </p>
                  </div>

                  {/* Rule Callout */}
                  <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-900 leading-relaxed">
                    <span className="font-bold flex items-center text-amber-950 mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700 shrink-0" />
                      <span>Eligibility Rule</span>
                    </span>
                    You can only affiliate with clients whose content campaign you have applied for. Brands where you have not applied for a campaign remain locked.
                  </div>

                  {/* Client List dynamically rendered from applied campaigns */}
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
                    {appliedCampaigns.length === 0 ? (
                      <div className="p-6 text-center bg-zinc-50/80 rounded-2xl border border-zinc-200/60 space-y-2">
                        <Lock className="w-6 h-6 text-zinc-400 mx-auto" />
                        <h4 className="font-bold text-xs text-zinc-700">No Eligible Affiliate Brands Yet</h4>
                        <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                          You haven't applied to any brand campaigns yet. Apply to campaigns first to unlock their 10% commission affiliate links.
                        </p>
                      </div>
                    ) : (
                      appliedCampaigns.map((camp) => {
                        const cleanHandle = (userProfile.displayName || userProfile.fullName || 'creator')
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '');
                        const brandKey = camp.brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const affiliateLink = `https://vively.club/r/${cleanHandle || 'creator'}/${brandKey}`;

                        return (
                          <div key={camp.id} className="bg-white border border-emerald-200/90 rounded-2xl p-3 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-black text-sm text-zinc-950">{camp.brandName}</span>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    Eligible · Applied
                                  </span>
                                </div>
                                <span className="text-[11px] text-zinc-500 block mt-0.5">
                                  Campaign: {camp.title}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(affiliateLink).catch(() => {});
                                  }
                                  setCopiedBrandKey(camp.id);
                                  if (onNotify) onNotify(`${camp.brandName} affiliate link copied!`, 'success');
                                  setTimeout(() => setCopiedBrandKey(null), 2200);
                                }}
                                className="px-3 py-1.5 bg-[#404040] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                              >
                                {copiedBrandKey === camp.id ? 'Copied!' : 'Copy Link'}
                              </button>
                            </div>
                            <div className="bg-zinc-50 px-2.5 py-1 rounded-lg text-[10.5px] font-mono text-zinc-600 truncate border border-zinc-100">
                              {affiliateLink}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Reset test button */}
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAffiliatorModalOpen(false)}
                      className="flex-1 py-3 bg-[#A9A4D3] hover:bg-[#9B95CB] text-white font-extrabold rounded-2xl text-xs transition-all shadow-2xs cursor-pointer"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateAffiliateStatus('idle');
                        if (onNotify) onNotify('Affiliate test state reset to idle.', 'info');
                      }}
                      className="py-3 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-2xl text-[11px] transition-all cursor-pointer"
                      title="Reset to test application again"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
