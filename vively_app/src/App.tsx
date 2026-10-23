import React, { useState, useEffect } from 'react';
import { 
  NavigationTab, UserProfile, PetState, Campaign, CreatorEvent, 
  CommunityPost, WalletState, WalletTransaction, PetType 
} from './types';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { WalkthroughCarousel } from './components/onboarding/WalkthroughCarousel';
import { AuthModal } from './components/onboarding/AuthModal';
import { CreatorOnboardingModal } from './components/onboarding/CreatorOnboardingModal';
import { PetCompanionModal } from './components/pet/PetCompanionModal';
import { CampaignsView } from './components/home/CampaignsView';
import { DiscoverView } from './components/discover/DiscoverView';
import { EventsView } from './components/events/EventsView';
import { MomentsView } from './components/moments/MomentsView';
import { CommunityView } from './components/community/CommunityView';
import { MyPageView } from './components/profile/MyPageView';
import { SignUpView } from './components/auth/SignUpView';
import { CustomerServiceModal } from './components/support/CustomerServiceModal';
import { Toast, ToastMessage } from './components/common/Toast';
import { VivelyBackground } from './components/common/VivelyBackground';
import confetti from 'canvas-confetti';

// Production storage keys guaranteeing complete isolation from legacy demo data
const STORAGE_KEY_PET = 'vively_pet_prod_v1';
const STORAGE_KEY_USER = 'vively_user_profile_prod_v1';
const STORAGE_KEY_CAMPAIGNS = 'vively_campaigns_clean_empty_v2';
const STORAGE_KEY_WALLET = 'vively_wallet_prod_v1';
const STORAGE_KEY_POSTS = 'vively_posts_prod_v1';
const STORAGE_KEY_EVENTS = 'vively_events_clean_empty_v2';

// One-time automatic purge of legacy demo keys from browser storage
try {
  const legacyKeys = [
    'vively_campaigns_prod_v1', 'vively_events_prod_v1',
    'vively_wallet_clean_v2', 'vively_user_profile_clean_v2', 'vively_campaigns_clean_v2',
    'vively_pet_state_clean_v2', 'vively_posts_clean_v2', 'vively_events_clean_v2',
    'vively_moments_data_v3', 'vively_moments_data_v2', 'vively_moments_data_v1',
    'vively_referral_points_bonus', 'vively_referral_invite_count',
    'vively_user_profile_clean', 'vively_wallet_clean', 'vively_campaigns_clean',
    'vively_pet_state_clean', 'vively_posts_clean', 'vively_events_clean',
    'vively_affiliate_status', 'vively_moments'
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch {
  // ignore storage errors
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [myPageSubTab, setMyPageSubTab] = useState<'campaigns' | 'wallet' | 'management'>('campaigns');
  const [isPreviewSignup, setIsPreviewSignup] = useState<boolean>(false);

  // Auth & Onboarding state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [showWalkthrough, setShowWalkthrough] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [customerServiceOpen, setCustomerServiceOpen] = useState<boolean>(false);

  // Frame toggle
  const [isDesktopFrame, setIsDesktopFrame] = useState<boolean>(true);

  // 1. User Profile Kosong
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      id: '',
      fullName: '',
      displayName: '',
      email: '',
      phoneNumber: '',
      gender: '',
      dateOfBirth: '',
      city: '',
      country: '',
      avatarUrl: '',
      bio: '',
      niche: '',
      socialHandles: {
        instagram: '',
        tiktok: '',
        youtube: '',
      },
      followerRange: '',
      totalFollowers: '0',
      engagementRate: '0%',
      onTimeDeliveryRate: '100%',
      shippingAddress: {
        street: '',
        unit: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        country: '',
        deliveryNotes: '',
      },
      isOnboarded: false,
      savedCampaignIds: [],
    };
  });

  // 2. Pet State Reset ke Level 1 (Tanpa dummy stamps/perks)
  const [petState, setPetState] = useState<PetState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PET);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      name: 'Vively',
      petType: 'vessel',
      expression: 'joyful',
      level: 1,
      currentExp: 0,
      maxExp: 100,
      hunger: 100,
      happiness: 100,
      stage: 'Seedling',
      collarTheme: 'lavender',
      collectedStamps: [],
      activeAccessories: {},
      unlockedPerks: [],
    };
  });

  const [petModalOpen, setPetModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // 3. Campaigns (empty state ready for real brand-submitted campaigns)
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // 4. Platform Events (empty state ready for real host-created events)
  const [events, setEvents] = useState<CreatorEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // 5. Posts Kosong
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_POSTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // 6. Wallet Saldo 0 & Tanpa Riwayat Transaksi
  const [walletState, setWalletState] = useState<WalletState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WALLET);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      availableBalance: 0,
      pendingBalance: 0,
      lifetimeEarnings: 0,
      transactions: [],
    };
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PET, JSON.stringify(petState));
  }, [petState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(walletState));
  }, [walletState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  const addToast = (text: string, type: 'success' | 'info' | 'exp' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Gamification Engine
  const awardExp = (reason: string, amount: number) => {
    setPetState((prev) => {
      let newExp = prev.currentExp + amount;
      let newLevel = prev.level;
      let newMaxExp = prev.maxExp;
      let newStage = prev.stage;
      let newPerks = [...prev.unlockedPerks];

      if (newExp >= prev.maxExp && prev.level < 4) {
        newLevel = prev.level + 1;
        newExp = newExp - prev.maxExp;
        newMaxExp = Math.round(prev.maxExp * 1.4);

        if (newLevel === 2) {
          newStage = 'Budding Flora';
          if (!newPerks.includes('juno_hair_10_percent')) newPerks.push('juno_hair_10_percent');
        } else if (newLevel === 3) {
          newStage = 'K-Creator Icon';
          if (!newPerks.includes('labab_free_meal')) newPerks.push('labab_free_meal');
        } else if (newLevel >= 4) {
          newStage = 'Celestial Star';
          if (!newPerks.includes('vip_brand_invites')) newPerks.push('vip_brand_invites');
        }

        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        addToast(`🎉 LEVEL UP! ${prev.name} evolved to Level ${newLevel} (${newStage})!`, 'exp');
      } else {
        addToast(`+${amount} EXP: ${reason}`, 'exp');
      }

      return {
        ...prev,
        level: newLevel,
        currentExp: newExp,
        maxExp: newMaxExp,
        stage: newStage,
        unlockedPerks: newPerks,
        happiness: Math.min(100, prev.happiness + 5),
      };
    });
  };

  const handleFeedPet = () => {
    setPetState((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 25),
    }));
    awardExp('Watered Vively Plant (^-^)', 20);
    confetti({ particleCount: 25, spread: 40 });
  };

  const handlePetCompanion = () => {
    setPetState((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
    }));
    awardExp('Provided Gentle Sunlight & Care (*^^*)', 15);
  };

  const handleCollectFlowerStamp = (level: number, flowerName: string, rewardPoints: number) => {
    setPetState((prev) => {
      const current = prev.collectedStamps || [];
      if (current.includes(level)) return prev;
      return {
        ...prev,
        collectedStamps: [...current, level],
      };
    });
    setWalletState((prev) => ({
      ...prev,
      availableBalance: prev.availableBalance + rewardPoints * 10,
    }));
    awardExp(`Collected Lv.${level} ${flowerName} Stamp (✿)`, 50);
    addToast(`Collected ${flowerName} Stamp! +${rewardPoints * 10} KRW & +50 EXP (✿)`, 'exp');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  const handleEquipAccessory = (type: any, id?: string) => {
    if (type === 'vesselColor' || type === 'pot') {
      setPetState((prev) => ({
        ...prev,
        vesselColor: id,
        activeAccessories: {
          ...prev.activeAccessories,
          pot: id,
        },
      }));
      return;
    }
    if (type === 'collar') {
      setPetState((prev) => ({
        ...prev,
        collarTheme: id as any,
        activeAccessories: {
          ...prev.activeAccessories,
          collar: id,
        },
      }));
      addToast(`Equipped ${id} ribbon!`, 'info');
      return;
    }
    setPetState((prev) => ({
      ...prev,
      activeAccessories: {
        ...prev.activeAccessories,
        [type]: id,
      },
    }));
    addToast(id ? `Equipped ${type} accessory!` : `Unequipped ${type}`, 'info');
  };

  const handleRenamePet = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPetState((prev) => ({
      ...prev,
      name: trimmed,
    }));
    addToast(`Plant renamed to "${trimmed}"!`, 'success');
  };

  const handleSelectPetType = (_petType: PetType) => {
    setPetState((prev) => ({
      ...prev,
      petType: 'vessel',
      name: 'Vively',
    }));
  };

  const handleApplyCampaign = (
    campaignId: string, 
    pitchNote: string, 
    sampleVariant: string,
    visitReservation?: { date: string; timeSlot: string }
  ) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'applied', slotsRemaining: Math.max(0, c.slotsRemaining - 1) } : c))
    );
    const targetCamp = campaigns.find((c) => c.id === campaignId);
    const points = targetCamp ? (targetCamp.pointsReward || targetCamp.perksExp) : 100;
    awardExp(`Applied to ${targetCamp?.brandName || 'Brand'} Campaign`, points);

    if (visitReservation) {
      addToast(
        `Reservation requested! +${points} Points awarded. VIP table requested for ${visitReservation.date} (${visitReservation.timeSlot.split(':')[0]}).`,
        'success'
      );
    } else {
      addToast(
        `Application submitted! +${points} Points awarded. Custom PR seeding box will be dispatched to your address.`,
        'success'
      );
    }
  };

  const handleToggleSaveCampaign = (campaignId: string) => {
    setUserProfile((prev) => {
      const isSaved = prev.savedCampaignIds.includes(campaignId);
      const newSaved = isSaved
        ? prev.savedCampaignIds.filter((id) => id !== campaignId)
        : [...prev.savedCampaignIds, campaignId];
      addToast(isSaved ? 'Removed from saved' : 'Campaign bookmarked to My Page', 'info');
      return { ...prev, savedCampaignIds: newSaved };
    });
  };

  const handleToggleRsvp = (eventId: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const nextRsvpd = !ev.isUserRsvpd;
          if (nextRsvpd) {
            awardExp(`RSVP to ${ev.title}`, ev.expReward);
            addToast(`RSVP confirmed! Event pass sent to ${userProfile.email}`, 'success');
          } else {
            addToast(`RSVP cancelled for event.`, 'info');
          }
          return {
            ...ev,
            isUserRsvpd: nextRsvpd,
            rsvpCount: nextRsvpd ? ev.rsvpCount + 1 : Math.max(0, ev.rsvpCount - 1),
          };
        }
        return ev;
      })
    );
  };

  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextLiked = !post.isLiked;
          return {
            ...post,
            isLiked: nextLiked,
            likes: nextLiked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string, commentText: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: 'c-' + Date.now(),
            authorName: userProfile.fullName || 'Creator',
            authorAvatar: userProfile.avatarUrl,
            authorBadge: `Level ${petState.level} Creator`,
            content: commentText,
            createdAt: 'Just now',
            likes: 0,
          };
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );
    awardExp('Community Discussion Reply', 15);
  };

  const handleCreatePost = (newPostData: Omit<CommunityPost, 'id' | 'likes' | 'isLiked' | 'commentsCount' | 'comments' | 'createdAt'>) => {
    const post: CommunityPost = {
      ...newPostData,
      id: 'post-' + Date.now(),
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      createdAt: 'Just now',
    };
    setPosts((prev) => [post, ...prev]);
    awardExp('Created New Community Topic', 35);
  };

  const handleWithdrawFunds = (amount: number, method: string) => {
    setWalletState((prev) => ({
      ...prev,
      availableBalance: Math.max(0, prev.availableBalance - amount),
      transactions: [
        {
          id: 'tx-' + Date.now(),
          type: 'withdrawal',
          title: `Withdrawal via ${method}`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          amount: -amount,
          status: 'Processing',
        },
        ...(prev?.transactions || []),
      ],
    }));
    addToast(`Withdrawal of $${amount.toFixed(2)} USD initiated via ${method}!`, 'success');
  };

  const handleUpdateShippingAddress = (newAddress: UserProfile['shippingAddress']) => {
    setUserProfile((prev) => ({
      ...prev,
      shippingAddress: newAddress,
    }));
  };

  const handleUpdateProfile = (updatedData: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = {
        ...prev,
        ...updatedData,
      };
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast('Profile updated successfully! (✿◠‿◠)', 'success');
  };

  const handleAuthSuccess = (email: string, isNewUser: boolean) => {
    setIsAuthenticated(true);
    setAuthModalOpen(false);
    if (isNewUser) {
      setOnboardingModalOpen(true);
    } else {
      addToast(`Signed in as ${email}`, 'success');
    }
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setOnboardingModalOpen(false);
    awardExp('Adopted Vively Companion & Completed Profile', 100);
    addToast('Welcome to Vively Global! Starter Kit & Companion Unlocked!', 'success');
  };

  const handleSignUpComplete = (profileData: Partial<UserProfile>) => {
    setUserProfile((prev) => ({
      ...prev,
      ...profileData,
      shippingAddress: {
        ...(prev?.shippingAddress || {}),
        ...(profileData?.shippingAddress || {}),
      },
      socialHandles: {
        ...(prev?.socialHandles || {}),
        ...(profileData?.socialHandles || {}),
      },
    }));

    setIsPreviewSignup(false);
    setActiveTab('home');
    awardExp('Completed Creator Signup & Onboarding', 150);
    addToast('🎉 Welcome to Vively Global! Profile successfully activated.', 'success');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setAuthModalMode('signin');
    setAuthModalOpen(true);
    addToast('Signed out successfully.', 'info');
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-start text-slate-900 font-sans selection:bg-pink-100 selection:text-pink-700 relative">
      <VivelyBackground />
      <Toast toasts={toasts} onDismiss={removeToast} />

      <div 
        className={`w-full transition-all duration-300 ${
          isDesktopFrame 
            ? "max-w-[430px] my-0 md:my-5 md:rounded-[44px] md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] overflow-hidden min-h-screen md:min-h-[890px] relative flex flex-col md:ring-1 md:ring-white/50"
            : "max-w-2xl min-h-screen relative flex flex-col shadow-sm"
        }`}
      >
        {isDesktopFrame && (
          <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-1 text-[11px] font-semibold text-slate-800 select-none z-50 bg-transparent">
            <span>9:41</span>
            <div className="w-24 h-4 bg-slate-900 rounded-full" />
            <div className="flex items-center space-x-1.5 text-slate-700">
              <span>5G</span>
              <span className="w-5 h-2.5 bg-slate-200 rounded-xs flex items-center p-0.5">
                <span className="w-full h-full bg-slate-800 rounded-xs" />
              </span>
            </div>
          </div>
        )}

        {/* Toggle Bar */}
        <div className="px-5 pt-2 pb-1 flex items-center justify-between z-30 select-none">
          <div className="flex items-center space-x-1.5 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-xs font-bold text-white border border-white/20">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider mr-0.5">Preview:</span>
            <button
              type="button"
              onClick={() => setIsPreviewSignup(false)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isPreviewSignup 
                  ? 'bg-white text-zinc-950 shadow-xs' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              View Home
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewSignup(true)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                isPreviewSignup 
                  ? 'bg-white text-zinc-950 shadow-xs' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>View Signup</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </button>
          </div>

          <span className="text-[10.5px] font-semibold text-zinc-600 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/60">
            {isPreviewSignup ? 'Onboarding Mode' : 'Live Dashboard'}
          </span>
        </div>

        {/* Global Header */}
        {!isPreviewSignup && (
          <Header
            userProfile={userProfile}
            petState={petState}
            onOpenPetModal={() => setPetModalOpen(true)}
            isDesktopFrame={isDesktopFrame}
            onToggleFrame={() => setIsDesktopFrame(!isDesktopFrame)}
            unreadNotifications={0}
            isNotificationsOpen={notificationsOpen}
            onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
            onCloseNotifications={() => setNotificationsOpen(false)}
            onOpenProfile={() => {
              setActiveTab('profile');
              setMyPageSubTab('campaigns');
            }}
            onNavigateCampaign={() => setActiveTab('home')}
            onOpenCustomerService={() => setCustomerServiceOpen(true)}
            onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
            activeTab={activeTab}
          />
        )}

        {/* Active Module View */}
        <main className="flex-1 overflow-y-auto relative z-10">
          {isPreviewSignup ? (
            <SignUpView
              onComplete={handleSignUpComplete}
              onNavigateHome={() => setIsPreviewSignup(false)}
              onNotify={addToast}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <CampaignsView
                  campaigns={campaigns}
                  userProfile={userProfile}
                  walletBalance={walletState.availableBalance}
                  onApplyCampaign={handleApplyCampaign}
                  onToggleSave={handleToggleSaveCampaign}
                  onOpenPetModal={() => setPetModalOpen(true)}
                  onNotify={addToast}
                  onNavigateTab={setActiveTab}
                  onOpenWallet={() => {
                    setMyPageSubTab('wallet');
                    setActiveTab('profile');
                    addToast('Opening Creator Wallet', 'info');
                  }}
                  isSearchOpen={isSearchOpen}
                  onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
                  onCloseSearch={() => setIsSearchOpen(false)}
                  petState={petState}
                />
              )}

              {activeTab === 'discover' && (
                <DiscoverView
                  onNotify={addToast}
                  onAwardExp={awardExp}
                />
              )}

              {activeTab === 'events' && (
                <EventsView
                  events={events}
                  onToggleRsvp={handleToggleRsvp}
                  onNotify={addToast}
                />
              )}

              {(activeTab === 'moments' || activeTab === 'community') && (
                <MomentsView
                  userProfile={userProfile}
                  campaigns={campaigns}
                  onNotify={addToast}
                  onAwardExp={awardExp}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'profile' && (
                <MyPageView
                  key={myPageSubTab}
                  initialSubTab={myPageSubTab}
                  userProfile={userProfile}
                  petState={petState}
                  walletState={walletState}
                  campaigns={campaigns}
                  onOpenPetModal={() => setPetModalOpen(true)}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateShippingAddress={handleUpdateShippingAddress}
                  onWithdrawFunds={handleWithdrawFunds}
                  onRestartWalkthrough={() => setShowWalkthrough(true)}
                  onSignOut={handleSignOut}
                  onNotify={addToast}
                  onOpenCustomerService={() => setCustomerServiceOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Nav */}
        {!isPreviewSignup && (
          <BottomNav
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'profile') {
                setMyPageSubTab('campaigns');
              }
            }}
            hasActivePetPerk={petState.level >= 2}
          />
        )}
      </div>

      {/* Modals */}
      <PetCompanionModal
        isOpen={petModalOpen}
        onClose={() => setPetModalOpen(false)}
        petState={petState}
        onFeed={handleFeedPet}
        onPet={handlePetCompanion}
        onEquipAccessory={handleEquipAccessory}
        onRenamePet={handleRenamePet}
        onCompleteMicroTask={awardExp}
        onNotify={addToast}
        onSelectPetType={handleSelectPetType}
        onCollectStamp={handleCollectFlowerStamp}
      />

      {showWalkthrough && (
        <WalkthroughCarousel
          onFinishWalkthrough={() => setShowWalkthrough(false)}
          onOpenAuth={(mode) => {
            setShowWalkthrough(false);
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

      <CreatorOnboardingModal
        isOpen={onboardingModalOpen}
        userEmail={userProfile.email}
        onComplete={handleOnboardingComplete}
      />

      <CustomerServiceModal
        isOpen={customerServiceOpen}
        onClose={() => setCustomerServiceOpen(false)}
        userProfile={userProfile}
        onNotify={addToast}
      />
    </div>
  );
}