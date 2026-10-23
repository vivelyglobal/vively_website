import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Camera, User, 
  Sparkles, Calendar as CalendarIcon, Plus 
} from 'lucide-react';
import { Moment, UserProfile, Campaign, NavigationTab, MomentPrivacy } from '../../types';
import { QuickSnapCameraModal } from './QuickSnapCameraModal';
import { DateMomentsPopup } from './DateMomentsPopup';
import confetti from 'canvas-confetti';

interface MomentsViewProps {
  userProfile: UserProfile;
  campaigns: Campaign[];
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
  onAwardExp: (reason: string, amount: number) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

const STORAGE_KEY_MOMENTS = 'vively_moments_prod_v1';

// Helper to format Date into "YYYY-MM-DD"
const formatDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const MomentsView: React.FC<MomentsViewProps> = ({
  userProfile,
  campaigns,
  onNotify,
  onAwardExp,
  onNavigateTab,
}) => {
  // Moments persistence state (starts clean and empty for real users)
  const [moments, setMoments] = useState<Moment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOMENTS, JSON.stringify(moments));
    } catch {}
  }, [moments]);

  // Calendar View State: Month & Selected Date
  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(today);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(formatDateKey(today));

  // Date Moments Popup state (Opens immediately when tapping a date with moments!)
  const [activeDatePopupKey, setActiveDatePopupKey] = useState<string | null>(null);

  // Quick Snap Camera Modal state (Opens immediately when tapping "+ Quick Snap"!)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  // Creator Profile Preview Modal
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState<{
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    followers?: string;
  } | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const t = new Date();
    setViewDate(t);
    setSelectedDateKey(formatDateKey(t));
  };

  // Calendar calculations
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0 - 11
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Group moments by dateKey
  const momentsByDate = moments.reduce<Record<string, Moment[]>>((acc, m) => {
    if (!acc[m.dateKey]) acc[m.dateKey] = [];
    acc[m.dateKey].push(m);
    return acc;
  }, {});

  // Format date for heading/popup (e.g. "October 16, 2026")
  const formatDateHeading = (key: string) => {
    const parts = key.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return key;
  };

  // Tapping a date in the calendar:
  // If date contains moments -> open the photo popup IMMEDIATELY!
  // If date has no moments -> select date quietly and show gentle hint.
  const handleDateClick = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    const dayMoments = momentsByDate[dateKey] || [];
    if (dayMoments.length > 0) {
      setActiveDatePopupKey(dateKey);
    } else {
      onNotify('No moments on this date yet · Tap + Quick Snap to share one!', 'info');
    }
  };

  // Toggle Like on Moment
  const handleToggleLike = (momentId: string) => {
    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === momentId) {
          const willLike = !m.isLiked;
          return {
            ...m,
            isLiked: willLike,
            likes: willLike ? m.likes + 1 : Math.max(0, m.likes - 1),
          };
        }
        return m;
      })
    );
  };

  // Add Comment to Moment
  const handleAddComment = (momentId: string, commentText: string) => {
    const currentUserId = userProfile.id || 'my-user';
    const newComment = {
      id: `comm-${Date.now()}`,
      authorId: currentUserId,
      authorName: userProfile.fullName || userProfile.displayName || 'You',
      authorUsername: userProfile.displayName ? `@${userProfile.displayName}` : '@creator',
      authorAvatar: userProfile.avatarUrl || '',
      content: commentText,
      createdAt: 'Just now',
    };

    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === momentId) {
          return {
            ...m,
            comments: [...m.comments, newComment],
          };
        }
        return m;
      })
    );
    onNotify('Comment posted!', 'info');
  };

  // Handle Share from Quick Snap Camera Modal
  const handleShareMomentFromCamera = (data: {
    photoUrl: string;
    campaignId: string;
    campaignTitle: string;
    campaignBrand: string;
    snapNumber: number;
    milestone: string;
    note: string;
    privacy: MomentPrivacy;
  }) => {
    const currentUserId = userProfile.id || 'my-user';
    const todayStr = formatDateKey(new Date());

    const newMoment: Moment = {
      id: `moment-${Date.now()}`,
      creatorId: currentUserId,
      creatorName: userProfile.fullName || userProfile.displayName || 'You',
      creatorUsername: userProfile.socialHandles?.instagram
        ? (userProfile.socialHandles.instagram.startsWith('@')
            ? userProfile.socialHandles.instagram
            : `@${userProfile.socialHandles.instagram}`)
        : (userProfile.displayName ? `@${userProfile.displayName}` : '@creator'),
      creatorAvatar: userProfile.avatarUrl || '',
      creatorBio: userProfile.bio || '',
      creatorFollowers: userProfile.totalFollowers || '0',
      campaignId: data.campaignId,
      campaignTitle: data.campaignTitle,
      campaignBrand: data.campaignBrand,
      photoUrl: data.photoUrl,
      snapNumber: data.snapNumber,
      totalSnapsInCampaign: 3,
      milestone: data.milestone,
      note: data.note,
      privacy: data.privacy,
      dateKey: todayStr,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      comments: [],
    };

    setMoments((prev) => [newMoment, ...prev]);
    setSelectedDateKey(todayStr);
    setViewDate(new Date());

    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    onNotify('✨ Moment shared to your visual calendar!', 'success');
    onAwardExp('Shared UGC Moment', 15);
  };

  // Total moments in viewed month
  const totalMomentsInMonth = Object.keys(momentsByDate).reduce((acc, key) => {
    const parts = key.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (y === currentYear && m === currentMonth) {
        return acc + momentsByDate[key].length;
      }
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-full pb-28 pt-2 px-4 max-w-md mx-auto select-none space-y-4">
      {/* 1. MINIMAL HEADER */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-950 tracking-tight leading-none">
            Moments
          </h1>
          <p className="text-[12px] text-zinc-500 font-normal mt-1">
            Visual diary of creator campaigns
          </p>
        </div>

        {/* Immediate Quick Snap Camera Action */}
        <button
          type="button"
          onClick={() => setIsCameraModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          aria-label="Quick Snap: Open Camera"
        >
          <Camera className="w-3.5 h-3.5 text-white" />
          <span>+ Quick Snap</span>
        </button>
      </header>

      {/* 2. CALENDAR-FIRST INTERFACE (MAIN VISUAL ELEMENT) */}
      <div className="rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-4 sm:p-5 transition-all">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100/80">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm sm:text-[15px] text-zinc-950 tracking-tight">
              {monthName}
            </span>
            {(viewDate.getMonth() !== today.getMonth() || viewDate.getFullYear() !== today.getFullYear()) && (
              <button
                type="button"
                onClick={handleGoToToday}
                className="text-[11px] font-semibold text-[#5B4E8C] hover:underline cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Column Day Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-zinc-400 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* 7-Column Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {/* Leading empty cells before the 1st of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square p-1" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const y = currentYear;
            const m = String(currentMonth + 1).padStart(2, '0');
            const d = String(dayNum).padStart(2, '0');
            const cellDateKey = `${y}-${m}-${d}`;

            const dayMoments = momentsByDate[cellDateKey] || [];
            const hasMoments = dayMoments.length > 0;
            const representativeMoment = dayMoments[0];
            const isSelected = selectedDateKey === cellDateKey;
            const isToday = cellDateKey === formatDateKey(today);

            return (
              <button
                key={cellDateKey}
                type="button"
                onClick={() => handleDateClick(cellDateKey)}
                className={`relative aspect-square rounded-2xl overflow-hidden transition-all flex flex-col items-center justify-center cursor-pointer group ${
                  isSelected
                    ? 'ring-2 ring-zinc-950 ring-offset-2 ring-offset-white shadow-sm scale-[1.03]'
                    : 'hover:scale-[1.02]'
                } ${
                  hasMoments
                    ? 'bg-zinc-900 shadow-2xs'
                    : 'bg-zinc-50/70 hover:bg-zinc-100/90 text-zinc-700'
                }`}
                aria-label={`${cellDateKey}: ${dayMoments.length} moments`}
              >
                {hasMoments ? (
                  <>
                    {/* Square Thumbnail Photo filling date cell */}
                    <img
                      src={representativeMoment.photoUrl}
                      alt={representativeMoment.campaignTitle}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

                    {/* Day number top-left */}
                    <span className="absolute top-1 left-1.5 text-[10px] sm:text-[11px] font-extrabold text-white drop-shadow-sm leading-none">
                      {dayNum}
                    </span>

                    {/* Multiple moments subtle count indicator (e.g. +2) */}
                    {dayMoments.length > 1 && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white leading-none">
                        +{dayMoments.length - 1}
                      </span>
                    )}

                    {/* Today indicator dot */}
                    {isToday && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 ring-1 ring-white" />
                    )}
                  </>
                ) : (
                  <>
                    {/* Quiet Empty Date */}
                    <span className={`text-xs font-semibold ${isToday ? 'text-zinc-950 font-bold' : 'text-zinc-500'}`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-zinc-950 mt-0.5" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MINIMAL QUIET SUMMARY (OLD OVERSIZED LIST REMOVED AS REQUESTED) */}
      <div className="flex items-center justify-between px-2 pt-1 text-xs text-zinc-500 font-medium">
        <span className="flex items-center space-x-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span>
            {totalMomentsInMonth > 0 
              ? `${totalMomentsInMonth} moments captured in ${monthName}` 
              : 'No moments shared yet'}
          </span>
        </span>

        <button
          type="button"
          onClick={() => setIsCameraModalOpen(true)}
          className="text-xs font-semibold text-[#5B4E8C] hover:text-[#453874] flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Snap</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. DATE MOMENTS PHOTO POPUP (OPENS IMMEDIATELY ON TAP)                     */}
      {/* ========================================================================= */}
      {activeDatePopupKey && (
        <DateMomentsPopup
          isOpen={!!activeDatePopupKey}
          onClose={() => setActiveDatePopupKey(null)}
          moments={momentsByDate[activeDatePopupKey] || []}
          dateTitle={formatDateHeading(activeDatePopupKey)}
          userProfile={userProfile}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
          onOpenCreatorProfile={(creator) => setSelectedCreatorProfile(creator)}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. QUICK SNAP CAMERA MODAL (OPENS IMMEDIATELY ON + QUICK SNAP)            */}
      {/* ========================================================================= */}
      <QuickSnapCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        userProfile={userProfile}
        campaigns={campaigns}
        moments={moments}
        onShareMoment={handleShareMomentFromCamera}
        onNotify={onNotify}
      />

      {/* ========================================================================= */}
      {/* 6. CREATOR PROFILE PREVIEW MODAL                                          */}
      {/* ========================================================================= */}
      {selectedCreatorProfile && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[28px] p-5 w-full max-w-xs shadow-2xl border border-zinc-100 text-center space-y-3">
            <div className="relative w-16 h-16 rounded-full mx-auto overflow-hidden bg-zinc-100 ring-2 ring-zinc-200">
              {selectedCreatorProfile.avatar ? (
                <img
                  src={selectedCreatorProfile.avatar}
                  alt={selectedCreatorProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base text-zinc-950">
                {selectedCreatorProfile.name}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                {selectedCreatorProfile.username}
              </p>
              {selectedCreatorProfile.followers && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {selectedCreatorProfile.followers} Followers
                </span>
              )}
            </div>

            {selectedCreatorProfile.bio && (
              <p className="text-xs text-zinc-600 italic px-2">
                "{selectedCreatorProfile.bio}"
              </p>
            )}

            <button
              type="button"
              onClick={() => setSelectedCreatorProfile(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
