import React from 'react';
import { Home, Compass, Camera, User } from 'lucide-react';
import { NavigationTab } from '../../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onChangeTab: (tab: NavigationTab) => void;
  hasActivePetPerk?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  hasActivePetPerk = true,
}) => {
  const navItems = [
    { id: 'home' as NavigationTab, label: 'Home' },
    { id: 'discover' as NavigationTab, label: 'Discover' },
    { id: 'events' as NavigationTab, label: 'Events' },
    { id: 'moments' as NavigationTab, label: 'Moments' },
    { id: 'profile' as NavigationTab, label: 'My Page' },
  ];

  return (
    <div className="fixed bottom-3.5 left-0 right-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
      <nav
        className="pointer-events-auto relative bg-white/45 backdrop-blur-2xl backdrop-saturate-150 rounded-full px-2.5 py-1.5 shadow-[0_12px_40px_-6px_rgba(0,0,0,0.12),0_1px_2px_rgba(255,255,255,0.9)_inset,0_0_0_1px_rgba(255,255,255,0.5)] flex items-center justify-around border border-white/60 overflow-hidden"
        aria-label="Main Navigation"
      >
        {/* Subtle glass specular highlight sheen across top rim */}
        <div 
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-full" 
          aria-hidden="true" 
        />

        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'moments' && activeTab === ('community' as any));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`relative z-10 flex-1 py-1.5 px-1.5 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none ${
                isActive 
                  ? 'bg-white/75 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.9)_inset] text-zinc-950 backdrop-blur-md scale-[1.02]' 
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/20'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                {/* Tab 1: Home */}
                {item.id === 'home' && (
                  <Home
                    className={`w-5 h-5 transition-all ${
                      isActive
                        ? 'stroke-[2.2px] text-zinc-950 fill-black/10'
                        : 'stroke-[1.8px] text-zinc-500'
                    }`}
                  />
                )}

                {/* Tab 2: Discover */}
                {item.id === 'discover' && (
                  <Compass
                    className={`w-5 h-5 transition-all ${
                      isActive
                        ? 'stroke-[2.2px] text-zinc-950 fill-black/10'
                        : 'stroke-[1.8px] text-zinc-500'
                    }`}
                  />
                )}

                {/* Tab 3: Events (Calendar with star) */}
                {item.id === 'events' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`w-5 h-5 transition-all ${
                      isActive ? 'stroke-zinc-950' : 'stroke-zinc-500'
                    }`}
                    strokeWidth={isActive ? '2.2' : '1.8'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="3" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path
                      d="M12 12.8l.75 1.5 1.65.25-1.2 1.15.3 1.65-1.5-.8-1.5.8.3-1.65-1.2-1.15 1.65-.25z"
                      fill={isActive ? 'currentColor' : 'none'}
                      strokeWidth="1.5"
                    />
                  </svg>
                )}

                {/* Tab 4: Moments (Camera / Photo Diary) */}
                {item.id === 'moments' && (
                  <Camera
                    className={`w-5 h-5 transition-all ${
                      isActive
                        ? 'stroke-[2.2px] text-zinc-950 fill-black/10'
                        : 'stroke-[1.8px] text-zinc-500'
                    }`}
                  />
                )}

                {/* Tab 5: My Page */}
                {item.id === 'profile' && (
                  <>
                    <User
                      className={`w-5 h-5 transition-all ${
                        isActive
                          ? 'stroke-[2.2px] text-zinc-950 fill-black/10'
                          : 'stroke-[1.8px] text-zinc-500'
                      }`}
                    />
                    {hasActivePetPerk && (
                      <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 ring-2 ring-white/90 shadow-xs" />
                    )}
                  </>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-0.5 tracking-tight leading-none ${
                  isActive ? 'font-bold text-zinc-950' : 'font-medium text-zinc-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
