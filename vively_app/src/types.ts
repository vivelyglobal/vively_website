export type NavigationTab = 'home' | 'discover' | 'events' | 'moments' | 'community' | 'profile';

export type ContentNiche = 'K-Beauty' | 'Fashion' | 'Food/Cafe' | 'Travel' | 'Lifestyle' | 'Pharmacy' | 'Salon' | 'Stay';

export type FollowerRange = '1K - 10K' | '10K - 50K' | '50K - 100K' | '100K - 500K' | '500K+';

export interface UserProfile {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  city: string;
  country: string;
  avatarUrl: string;
  bio: string;
  niche: ContentNiche;
  socialHandles: {
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  followerRange: FollowerRange;
  totalFollowers: string;
  engagementRate: string;
  onTimeDeliveryRate: string;
  shippingAddress: {
    street: string;
    unit: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
    deliveryNotes?: string;
  };
  isOnboarded: boolean;
  savedCampaignIds: string[];
}

export type PetType = 'vessel' | 'plant';
export type VesselExpression = 'joyful' | 'winking' | 'sparkle' | 'love' | 'sleepy' | 'cheeky';
export type PetStage = 'Baby Sprout' | 'Tender Stem' | 'Budding Flora' | 'Blooming Blossom' | 'Lush Flora Star' | 'Celestial Bloom';

export interface FlowerStamp {
  level: number;
  flowerName: string;
  koreanName: string;
  emoticon: string; // Basic text emoticon like (✿), (*^^*)
  color: string;
  sealColor: string;
  meaning: string;
  rewardPoints: number;
  bonusTitle: string;
}

export interface PetAccessory {
  id: string;
  name: string;
  icon: string;
  type: 'collar' | 'charm' | 'aura' | 'head' | 'glasses' | 'neck' | 'prop' | 'pot';
  unlockedAtLevel: number;
}

export interface PetState {
  name: string;
  petType?: PetType; // 'vessel'
  expression?: VesselExpression;
  level: number;
  currentExp: number;
  maxExp: number;
  hunger: number; // 0 - 100 (Hydration / Water)
  happiness: number; // 0 - 100 (Sunlight / Care)
  stage: PetStage;
  vesselColor?: string; // Ceramic vessel color id, e.g. 'white', 'pink', 'mint', 'lavender', 'cream', 'noir', 'terracotta'
  collarTheme?: 'lavender' | 'black' | 'cream' | 'pink';
  potTheme?: 'white' | 'lavender' | 'charcoal' | 'terracotta';
  collectedStamps?: number[]; // list of level numbers stamped, e.g. [1, 2]
  activeAccessories: {
    collar?: string;
    charm?: string;
    aura?: string;
    head?: string;
    glasses?: string;
    neck?: string;
    prop?: string;
    pot?: string;
  };
  unlockedPerks: string[];
}

export type CompensationType = 'Gifted/PR' | 'Paid' | 'Affiliate';

export interface CampaignTimeline {
  applicationDate: string;
  selectionDate: string;
  deliveryWindow: string;
  endDate: string;
}

export interface CampaignBrandInfo {
  introduction?: string;
  starProducts?: string[];
  seedingBoxDescription?: string;
}

export interface CampaignVisitSettings {
  isVisitRequired: boolean;
  visitNotice?: string;
  blackoutDays?: string[];
  availableTimeSlots?: string[];
  availableDates?: string[];
  venueAddress?: string;
  googleMapsLink?: string;
  instagramLink?: string;
  collaboratorHandles?: string[];
}

export interface Campaign {
  id: string;
  brandName: string;
  brandLogo: string;
  brandVerified: boolean;
  title: string;
  category: ContentNiche | 'Stay';
  compensationType: CompensationType;
  compensationValue: string;
  productSampleName: string;
  productSampleImage: string;
  productValue: string;
  deadline: string;
  daysRemaining: number;
  deliverables: string[];
  slotsTotal: number;
  slotsRemaining: number;
  description: string;
  requirements: string[];
  perksExp: number;
  status?: 'open' | 'applied' | 'approved' | 'shipped' | 'completed';
  targetRegion?: string;
  creatorsTarget?: number;
  pointsReward?: number;
  timeline?: CampaignTimeline;
  brandInfo?: CampaignBrandInfo;
  creatorCriteria?: string[];
  contentGuidelines?: string[];
  seedingOptions?: string[];
  visitSettings?: CampaignVisitSettings;
  uploadTime?: string;
  nationality?: string;
  deliverableSummary?: string;
  shortExplanation?: string;
  companyPicture?: string;
  dropTier?: 'Standard' | 'Pro';
  incentiveFee?: string;
  isProEligible?: boolean;
  deliverableSpec?: string;
  secondaryUsage?: string;
  isExpressTurnaround?: boolean;
  minFollowersRequired?: number;
  isAffiliate?: boolean;
  affiliateCommission?: string;
}

export interface CreatorEvent {
  id: string;
  title: string;
  eventType: 'In-Person (Seoul)' | 'Online Workshop' | 'Brand VIP Pop-Up';
  date: string;
  time: string;
  locationName: string;
  district: string;
  address: string;
  bannerImage: string;
  host: string;
  hostLogo: string;
  capacity: number;
  rsvpCount: number;
  isUserRsvpd: boolean;
  tags: string[];
  perks: string;
  expReward: number;
}

export interface TopCreator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  niche: string;
  followers: string;
  growthRate: string;
  highlightPost: string;
  bio: string;
  platforms: ('instagram' | 'tiktok' | 'youtube')[];
}

export interface TrendingHook {
  id: string;
  hook: string;
  platform: 'TikTok' | 'Reels' | 'Shorts';
  category: string;
  avgEngagementMultiplier: string;
  exampleAngle: string;
}

export interface TrendingSound {
  id: string;
  title: string;
  artist: string;
  viralityScore: number;
  vibe: string;
  videoCount: string;
}

export interface CommunityComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorBadge: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

export interface CommunityPost {
  id: string;
  category: 'Q&A' | 'Collab Requests' | 'Brand Reviews' | 'Content Tips';
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorLevel: number;
  title: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  comments: CommunityComment[];
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'payout' | 'bonus' | 'withdrawal';
  title: string;
  brand?: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Processing';
}

export interface WalletState {
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  transactions: WalletTransaction[];
}

export type MomentMilestone =
  | 'Product received'
  | 'Testing or filming'
  | 'Content published'
  | 'Restaurant visit'
  | 'Salon experience'
  | 'Campaign completed';

export type MomentPrivacy = 'community' | 'friends' | 'private';

export interface MomentComment {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Moment {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar?: string;
  creatorBio?: string;
  creatorFollowers?: string;
  campaignId: string;
  campaignTitle: string;
  campaignBrand?: string;
  photoUrl: string;
  snapNumber: number; // 1, 2, or 3 (Strict maximum 3 snaps per campaign participation!)
  totalSnapsInCampaign?: number;
  milestone?: string;
  note?: string; // Max 160 characters
  privacy: MomentPrivacy;
  dateKey: string; // "YYYY-MM-DD" e.g. "2026-10-16"
  createdAt: string; // ISO string
  likes: number;
  isLiked?: boolean;
  comments: MomentComment[];
}
