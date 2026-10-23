import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Heart, MessageSquare, ChevronLeft, ChevronRight, 
  Send, Lock, Globe, Users, ExternalLink, User 
} from 'lucide-react';
import { Moment, MomentComment, UserProfile } from '../../types';

interface DateMomentsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  moments: Moment[];
  dateTitle: string;
  userProfile: UserProfile;
  onToggleLike: (momentId: string) => void;
  onAddComment: (momentId: string, commentText: string) => void;
  onOpenCreatorProfile?: (creator: {
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    followers?: string;
  }) => void;
}

export const DateMomentsPopup: React.FC<DateMomentsPopupProps> = ({
  isOpen,
  onClose,
  moments,
  dateTitle,
  userProfile,
  onToggleLike,
  onAddComment,
  onOpenCreatorProfile,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>('');
  
  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Reset index when moments list changes or opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsCommentsOpen(false);
      setCommentInput('');
    }
  }, [isOpen, dateTitle]);

  // Handle keyboard navigation (Left/Right arrow, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, moments.length]);

  if (!isOpen || moments.length === 0) return null;

  const currentMoment = moments[currentIndex] || moments[0];
  const hasMultiple = moments.length > 1;

  const handleNext = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch gesture listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 40; // minimum swipe distance in px

    if (diff > threshold) {
      // Swiped left -> next photo
      handleNext();
    } else if (diff < -threshold) {
      // Swiped right -> prev photo
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Photo tap zones (Left 35% -> prev, Right 35% -> next)
  const handlePhotoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.35) {
      handlePrev();
    } else if (clickX > width * 0.65) {
      handleNext();
    }
  };

  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commentInput.trim();
    if (!text) return;
    onAddComment(currentMoment.id, text);
    setCommentInput('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        // Close when clicking directly on the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Photo Popup Card */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-white rounded-[28px] overflow-hidden shadow-2xl border border-zinc-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Creator profile & close button */}
        <div className="p-3.5 px-4 flex items-center justify-between border-b border-zinc-100/90 shrink-0 bg-white">
          <div 
            onClick={() => {
              if (onOpenCreatorProfile) {
                onOpenCreatorProfile({
                  name: currentMoment.creatorName,
                  username: currentMoment.creatorUsername,
                  avatar: currentMoment.creatorAvatar,
                  bio: currentMoment.creatorBio,
                  followers: currentMoment.creatorFollowers,
                });
              }
            }}
            className="flex items-center space-x-2.5 cursor-pointer group min-w-0"
          >
            {currentMoment.creatorAvatar ? (
              <img
                src={currentMoment.creatorAvatar}
                alt={currentMoment.creatorName}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-200 group-hover:opacity-90 transition-opacity shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            )}

            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-[13px] text-zinc-950 truncate group-hover:text-[#5B4E8C] transition-colors leading-tight">
                {currentMoment.creatorName}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate leading-tight mt-0.5">
                {currentMoment.creatorUsername} · {dateTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Pagination count indicator if multiple moments */}
            {hasMultiple && (
              <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                {currentIndex + 1} / {moments.length}
              </span>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close photo viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle: Large Moment Photo with Tap/Swipe Zones */}
        <div 
          className="relative w-full aspect-square bg-zinc-950 overflow-hidden select-none cursor-pointer flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handlePhotoClick}
        >
          <img
            key={currentMoment.id}
            src={currentMoment.photoUrl}
            alt={currentMoment.campaignTitle}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Left subtle chevron button if has previous */}
          {hasMultiple && currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              aria-label="Previous Moment"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right subtle chevron button if has next */}
          {hasMultiple && currentIndex < moments.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              aria-label="Next Moment"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Subtle dots indicator at bottom center of photo */}
          {hasMultiple && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs pointer-events-none">
              {moments.map((_, idx) => (
                <span
                  key={idx}
                  className={`rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-4 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Privacy badge if not public */}
          {currentMoment.privacy === 'private' && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white flex items-center space-x-1">
              <Lock className="w-3 h-3 text-zinc-300" />
              <span>Only Me</span>
            </span>
          )}
        </div>

        {/* Footer Info & Interactions */}
        <div className="p-3.5 px-4 space-y-2 bg-white shrink-0">
          {/* Linked Campaign & Milestone */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs sm:text-[13.5px] text-zinc-950 truncate">
                {currentMoment.campaignTitle}
              </h3>
              <span className="text-[10px] font-bold text-[#5B4E8C] shrink-0 ml-2">
                Snap {currentMoment.snapNumber} of 3
              </span>
            </div>

            {currentMoment.milestone && (
              <p className="text-[11px] text-zinc-500 font-medium truncate">
                {currentMoment.milestone}
              </p>
            )}
          </div>

          {/* Creator Note */}
          {currentMoment.note && (
            <p className="text-xs text-zinc-700 italic leading-snug">
              "{currentMoment.note}"
            </p>
          )}

          {/* Actions Bar: Heart Reaction & Comment Icon */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
            <div className="flex items-center space-x-3">
              {/* Heart Button */}
              <button
                type="button"
                onClick={() => onToggleLike(currentMoment.id)}
                className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer active:scale-95 transition-transform"
                aria-label="Like Moment"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    currentMoment.isLiked
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                />
                <span className={currentMoment.isLiked ? 'text-rose-600 font-bold' : ''}>
                  {currentMoment.likes}
                </span>
              </button>

              {/* Comment Button */}
              <button
                type="button"
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer active:scale-95 transition-transform"
                aria-label="View or add comments"
              >
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                <span>{currentMoment.comments.length}</span>
              </button>
            </div>

            {/* Hint to swipe/tap if multiple moments */}
            {hasMultiple && (
              <span className="text-[10px] text-zinc-400 font-medium">
                Tap side or swipe to browse
              </span>
            )}
          </div>

          {/* Expandable Comments Drawer */}
          {isCommentsOpen && (
            <div className="pt-2 border-t border-zinc-100 space-y-2 animate-in fade-in duration-150">
              {/* Comments List */}
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {currentMoment.comments.length > 0 ? (
                  currentMoment.comments.map((c) => (
                    <div key={c.id} className="bg-zinc-50 rounded-xl p-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 text-[11px]">
                          {c.authorUsername || c.authorName}
                        </span>
                        <span className="text-[9.5px] text-zinc-400">{c.createdAt}</span>
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-tight">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-zinc-400 text-center py-1.5 italic">
                    No comments yet. Leave a note!
                  </p>
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSendComment} className="flex items-center space-x-1.5 pt-0.5">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Leave a short comment..."
                  className="flex-1 bg-zinc-100 rounded-full px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="w-7 h-7 rounded-full bg-zinc-900 disabled:opacity-40 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                  aria-label="Send"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
