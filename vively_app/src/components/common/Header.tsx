import React from 'react';
import { Bell, Headphones, Smartphone, Maximize2, Search } from 'lucide-react';
import { PetState, UserProfile } from '../../types';
import { NotificationsChatBubble } from './NotificationsChatBubble';

interface HeaderProps {
  userProfile?: UserProfile;
  petState: PetState;
  onOpenPetModal: () => void;
  isDesktopFrame: boolean;
  onToggleFrame: () => void;
  unreadNotifications?: number;
  isNotificationsOpen?: boolean;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onOpenProfile?: () => void;
  onNavigateCampaign?: () => void;
  onOpenCustomerService?: () => void;
  onToggleSearch?: () => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  petState,
  onOpenPetModal,
  isDesktopFrame,
  onToggleFrame,
  unreadNotifications = 0,
  isNotificationsOpen = false,
  onToggleNotifications,
  onCloseNotifications,
  onOpenProfile,
  onNavigateCampaign,
  onOpenCustomerService,
  onToggleSearch,
  activeTab = 'home',
}) => {
  const displayName = userProfile?.displayName?.trim() || userProfile?.fullName?.trim() || '';
  const firstName = displayName ? displayName.split(' ')[0] : 'Creator';
  const level = petState?.level || 1;
  const isHome = activeTab === 'home';

  return (
    <header className="sticky top-0 z-40 px-5 pt-3.5 pb-1 transition-all select-none bg-transparent">
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        {/* User Greeting: Welcome Home, Creator or Name */}
        <div>
          <h1 className="font-extrabold text-[19px] sm:text-[20px] text-zinc-950 tracking-tight leading-tight">
            Welcome Home, {firstName}
          </h1>
        </div>

        {/* Right Controls: Bell, Headphones (matching screenshot 100%) */}
        <div className="flex items-center space-x-2">
          {/* Notifications Bell Button */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleNotifications}
              className="w-9 h-9 rounded-full bg-zinc-200/60 hover:bg-zinc-200 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-zinc-800 shadow-2xs backdrop-blur-xs"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 fill-zinc-700 text-zinc-700" />
              {unreadNotifications > 0 && !isNotificationsOpen && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 ring-1.5 ring-white" />
              )}
            </button>

            {/* Bubble Chat Notification Popover */}
            <NotificationsChatBubble
              isOpen={isNotificationsOpen}
              onClose={onCloseNotifications}
              onOpenPetModal={onOpenPetModal}
              onNavigateCampaign={onNavigateCampaign}
            />
          </div>

          {/* Customer Service / Direct Support Button */}
          {onOpenCustomerService && (
            <button
              type="button"
              onClick={onOpenCustomerService}
              className="w-9 h-9 rounded-full bg-zinc-200/60 hover:bg-zinc-200 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-zinc-800 shadow-2xs backdrop-blur-xs"
              title="Customer Service & Direct Inquiry"
              aria-label="Customer Service"
            >
              <Headphones className="w-4 h-4 text-zinc-700" />
            </button>
          )}

          {/* Switch to Fluid / Mobile Phone Frame on Desktop */}
          <button
            type="button"
            onClick={onToggleFrame}
            className="hidden md:flex w-7 h-7 rounded-full bg-white/60 hover:bg-white text-zinc-500 hover:text-black items-center justify-center transition-colors cursor-pointer ml-0.5"
            title={isDesktopFrame ? "Switch to Fluid Layout" : "Switch to Mobile Phone Frame"}
            aria-label="Toggle layout frame"
          >
            {isDesktopFrame ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Smartphone className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
