import { Campaign, CreatorEvent, TopCreator, TrendingHook, TrendingSound, CommunityPost, WalletState } from '../types';

export const INITIAL_CAMPAIGNS: Campaign[] = [];

export const UPCOMING_EVENTS: CreatorEvent[] = [];

export const TOP_CREATORS: TopCreator[] = [];

export const TRENDING_HOOKS: TrendingHook[] = [];

export const TRENDING_SOUNDS: TrendingSound[] = [];

export const COMMUNITY_POSTS: CommunityPost[] = [];

export const INITIAL_WALLET: WalletState = {
  availableBalance: 0,
  pendingBalance: 0,
  lifetimeEarnings: 0,
  transactions: [],
};
