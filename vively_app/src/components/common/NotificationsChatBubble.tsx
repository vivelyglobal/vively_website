import React from 'react';
import { motion } from 'motion/react';
import { X, Gift, Sparkles, Package, CheckCheck, ChevronRight } from 'lucide-react';

export interface NotificationItem {
  id: string;
  sender: string;
  avatarIcon: 'gift' | 'sparkles' | 'package';
  title: string;
  time: string;
  isRead: boolean;
  type: 'perk' | 'campaign' | 'shipping';
}

interface NotificationsChatBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPetModal: () => void;
  onNavigateCampaign?: () => void;
}

export const NotificationsChatBubble: React.FC<NotificationsChatBubbleProps> = ({
  isOpen,
  onClose,
  onOpenPetModal,
  onNavigateCampaign,
}) => {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleAction = (n: NotificationItem) => {
    onClose();
    if (n.type === 'perk') {
      onOpenPetModal();
    } else if (n.type === 'campaign' && onNavigateCampaign) {
      onNavigateCampaign();
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'gift':
        return <Gift className="w-3.5 h-3.5 text-zinc-900" />;
      case 'sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-zinc-900" />;
      case 'package':
      default:
        return <Package className="w-3.5 h-3.5 text-zinc-900" />;
    }
  };

  return (
    <>
      {/* Invisible backdrop to dismiss click outside */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose} 
      />

      {/* Bubble Chat Container - Sized to fit comfortably on screen without clipping */}
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 380 }}
        className="absolute right-[-4px] top-11 w-[265px] sm:w-[285px] z-50 select-none"
      >
        {/* Chat bubble pointer pointing up into center of the bell */}
        <div className="absolute -top-1.5 right-4 w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-zinc-200/90 shadow-[-2px_-2px_4px_rgba(0,0,0,0.02)] z-10" />

        {/* Chat Bubble Card Body */}
        <div className="relative bg-white rounded-[22px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-zinc-200/90 p-3 text-zinc-900 overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-black tracking-tight">Alerts & Messages</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] text-zinc-400 hover:text-black font-semibold flex items-center cursor-pointer transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3 h-3 mr-0.5" />
                <span>Mark read</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-5 h-5 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
            {notifications.length === 0 ? (
              <div className="py-7 px-3 text-center space-y-1.5">
                <p className="text-xs font-bold text-zinc-900">All caught up</p>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed max-w-[200px] mx-auto">
                  No new alerts. Your campaign dispatches, perks, and approvals will show here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start space-x-2 group"
                >
                  {/* Avatar Icon Circle */}
                  <div className="w-6 h-6 rounded-full bg-[#ECEEF2] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getIcon(n.avatarIcon)}
                  </div>

                  {/* Bubble Container */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-zinc-500 truncate">
                        {n.sender}
                      </span>
                      <span className="text-[9px] text-zinc-400 shrink-0 ml-1">
                        {n.time}
                      </span>
                    </div>

                    {/* Speech Bubble Box */}
                    <div
                      className={`rounded-[14px] rounded-tl-xs p-2.5 text-xs transition-all relative ${
                        !n.isRead
                          ? 'bg-[#ECEEF2] text-zinc-900'
                          : 'bg-zinc-50 text-zinc-700 border border-zinc-100/80'
                      }`}
                    >
                      {!n.isRead && (
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                      
                      {/* Notification Title */}
                      <h4 className="font-bold text-[11px] sm:text-[12px] text-black pr-2.5 leading-snug">
                        {n.title}
                      </h4>

                      {/* Left Bottom: See details (small text link, without box) */}
                      <div className="mt-1.5 flex items-center justify-start">
                        <button
                          type="button"
                          onClick={() => handleAction(n)}
                          className="text-[10px] font-semibold text-zinc-500 hover:text-black transition-colors flex items-center space-x-0.5 cursor-pointer p-0"
                        >
                          <span>See details</span>
                          <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="pt-2 text-center border-t border-zinc-100 mt-2">
            <span className="text-[9px] text-zinc-400">
              Vively Creator Updates & Seeding Alerts
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
};
