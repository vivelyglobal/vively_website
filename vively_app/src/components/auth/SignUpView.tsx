import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, ChevronDown, X, Loader2, Sparkles, Gift } from 'lucide-react';
import { UserProfile, ContentNiche } from '../../types';
import { SplashScreen } from '../common/SplashScreen';
import { VivelyLogo } from '../common/VivelyLogo';
import confetti from 'canvas-confetti';

export type RoadmapScreen = 
  | 'splash' 
  | 'welcome' 
  | 'signup_step1' 
  | 'signup_step2' 
  | 'signup_shipping'
  | 'signup_step3' 
  | 'loading_club';

interface SignUpViewProps {
  onComplete: (profileData: Partial<UserProfile>, bonusAmount?: number) => void;
  onNavigateHome?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'exp') => void;
  initialScreen?: RoadmapScreen;
}

// Background Assets
export const WHITE_BACKGROUND_URL = 'https://i.postimg.cc/prWMfQGF/white-background.png';
export const WHITE_BACKGROUND_FALLBACK = 'https://postimg.cc/gXT7dhPz';
export const SIGNUP_BG_URL = 'https://i.postimg.cc/yY0r13vw/sign-up.png';
export const VIVELY_LOGO_URL = 'https://i.postimg.cc/1R83jsJ7/logo-vively.png';

// Nationalities for autocomplete suggestion
const POPULAR_NATIONALITIES = [
  'South Korea', 'United States', 'Indonesia', 'Japan', 'Thailand',
  'Vietnam', 'Philippines', 'Singapore', 'Malaysia', 'United Kingdom',
  'Canada', 'Australia', 'France', 'Germany', 'Spain', 'Italy',
  'Taiwan', 'Hong Kong', 'China', 'India', 'Brazil', 'Mexico',
  'Netherlands', 'Sweden', 'New Zealand', 'Switzerland'
];

// Content categories from Screenshot
const CONTENT_CATEGORIES = [
  'Lifestyle',
  'Study Abroad',
  'Korea Life',
  'Travel',
  'Food',
  'Beauty',
  'Fashion',
  'Career',
  'Other',
];

// Courier delivery notes
const COURIER_NOTE_OPTIONS = [
  'Leave at the front door (Most common default)',
  'Leave with security / concierge',
  'Place inside delivery locker / parcel box',
  'Hand directly to recipient',
  'Ring the bell and leave at door',
  'Call / message upon arrival',
];

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="relative">
      <label className="absolute -top-2 left-4 px-1.5 bg-white text-[11px] font-medium text-zinc-500 rounded-xs z-10 pointer-events-none select-none">
        {label}
      </label>
      <input
        {...props}
        className={`w-full min-h-[48px] px-4 py-3 bg-white rounded-full text-xs font-medium text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-1.5 focus:ring-[#B4A7D6] placeholder:text-zinc-300 shadow-2xs transition-all ${className}`}
      />
    </div>
  );
};

// Social Handle Input with fixed @ prefix to reduce mobile typing friction
interface SocialHandleInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

const SocialHandleInput: React.FC<SocialHandleInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'yourhandle',
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Strip URL prefixes and extra @ signs automatically
    const cleaned = raw
      .replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\/?@?/i, '')
      .replace(/^@+/, '')
      .trim();
    onChange(cleaned);
  };

  return (
    <div className="relative">
      <label className="absolute -top-2 left-4 px-1.5 bg-white text-[11px] font-medium text-zinc-500 rounded-xs z-10 pointer-events-none select-none">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="flex items-center w-full min-h-[48px] px-4 py-3 bg-white rounded-full border border-zinc-200 focus-within:ring-1.5 focus-within:ring-[#B4A7D6] shadow-2xs transition-all">
        <span className="text-xs font-bold text-[#8C7AB8] select-none mr-1.5">
          @
        </span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className="w-full text-xs font-medium text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-300"
        />
      </div>
    </div>
  );
};

// 3-Step Progress Indicator to reduce feeling like filling out a tax form
const StepIndicator: React.FC<{ currentStep: 1 | 2 | 3 }> = ({ currentStep }) => {
  const stepTitles = [
    'Account Details',
    'Creator Vibe',
    'PR Delivery (Optional)',
  ];

  return (
    <div className="w-full max-w-sm mx-auto space-y-1.5 pb-2">
      <div className="flex items-center justify-between text-[11px] font-semibold px-1">
        <span className="text-[#8C7AB8] font-bold">
          Step {currentStep} of 3
        </span>
        <span className="text-zinc-500 font-medium">
          {stepTitles[currentStep - 1]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 w-full">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step <= currentStep
                ? 'bg-[#B4A7D6] shadow-xs'
                : 'bg-zinc-200/90'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export const SignUpView: React.FC<SignUpViewProps> = ({
  onComplete,
  onNavigateHome,
  onNotify,
  initialScreen = 'splash',
}) => {
  // Current active screen
  const [currentScreen, setCurrentScreen] = useState<RoadmapScreen>(initialScreen);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields - Step 1: Get Started
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Form Fields - Step 2: Tell us your creator vibe! (Simplified handles with @ prefix)
  const [gender, setGender] = useState<'Female' | 'Male' | 'Prefer not to say' | ''>('');
  const [nationality, setNationality] = useState('');
  const [showNationalitySuggestions, setShowNationalitySuggestions] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Beauty']);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Step 3: Domestic Shipping Address (Optional for now)
  const [roadAddress, setRoadAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [courierNote, setCourierNote] = useState(COURIER_NOTE_OPTIONS[0]);
  const [koreanPhone, setKoreanPhone] = useState('');

  // Bonus / Referral Code
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferralBonus, setAppliedReferralBonus] = useState(0);

  // Sign In Form Fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Filtered nationality suggestions
  const filteredNationalities = POPULAR_NATIONALITIES.filter((c) =>
    c.toLowerCase().includes(nationality.toLowerCase())
  );

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      } else {
        if (onNotify) onNotify('Please keep at least 1 content category selected', 'info');
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleFinishFinal = () => {
    setIsSubmitting(true);
    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.55 },
    });

    if (onNotify) {
      onNotify('🎉 Welcome to Vively Global! Profile successfully activated.', 'success');
    }

    const primaryNiche: ContentNiche = (selectedCategories[0] as ContentNiche) || 'K-Beauty';
    const cleanFullName = fullName.trim();

    setTimeout(() => {
      setIsSubmitting(false);
      onComplete({
        fullName: cleanFullName,
        displayName: cleanFullName ? cleanFullName.split(' ')[0] : 'Creator',
        email: email.trim(),
        phoneNumber: koreanPhone,
        gender: gender || 'Prefer not to say',
        country: nationality || 'South Korea',
        niche: primaryNiche,
        socialHandles: {
          instagram: instagramHandle ? (instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`) : '',
          tiktok: tiktokHandle ? (tiktokHandle.startsWith('@') ? tiktokHandle : `@${tiktokHandle}`) : '',
          youtube: '',
        },
        shippingAddress: {
          street: roadAddress,
          unit: detailAddress,
          city: '',
          stateProvince: '',
          postalCode,
          country: nationality || 'South Korea',
          deliveryNotes: courierNote,
        },
        isOnboarded: true,
      }, 0);

      if (onNavigateHome) {
        onNavigateHome();
      }
    }, 300);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentScreen('signup_step2');
    }, 240);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender) {
      if (onNotify) onNotify('Please select your gender', 'info');
      return;
    }
    if (!nationality.trim()) {
      if (onNotify) onNotify('Please enter your nationality', 'info');
      return;
    }
    if (!instagramHandle.trim()) {
      if (onNotify) onNotify('Please enter your Instagram handle', 'info');
      return;
    }
    if (selectedCategories.length === 0) {
      if (onNotify) onNotify('Please select at least one content category', 'info');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentScreen('signup_shipping');
    }, 240);
  };

  const handleSkipShipping = () => {
    if (onNotify) {
      onNotify('📦 Shipping address skipped! You can add it anytime from your Profile.', 'info');
    }
    setCurrentScreen('signup_step3');
  };

  const handleApplyReferral = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = referralCode.trim().toUpperCase();
    if (!cleanCode) {
      if (onNotify) onNotify('Please enter a referral code or tap No / Skip.', 'info');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAppliedReferralBonus(3000);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (onNotify) {
        onNotify('🎉 Referral Code Applied! +₩3,000 bonus unlocked!', 'success');
      }
      setTimeout(() => {
        setCurrentScreen('loading_club');
      }, 350);
    }, 200);
  };

  const handleSkipReferral = () => {
    setAppliedReferralBonus(0);
    if (onNotify) {
      onNotify('Proceeding with ₩5,000 welcome bonus active.', 'info');
    }
    setCurrentScreen('loading_club');
  };

  const handleFinishSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onNotify) {
        onNotify(`Welcome back, ${signInEmail.split('@')[0]}!`, 'success');
      }
      setAppliedReferralBonus(0);
      setCurrentScreen('loading_club');
    }, 240);
  };

  // Background styles
  const whiteBgStyle: React.CSSProperties = {
    backgroundImage: `url('${WHITE_BACKGROUND_URL}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const signupBgStyle: React.CSSProperties = {
    backgroundImage: `url('${SIGNUP_BG_URL}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="relative min-h-full flex-1 flex flex-col justify-between select-none bg-white overflow-hidden">
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* SCREEN 1: SPLASH SCREEN (Animated loading bar + transparent logo)         */}
        {/* ========================================================================= */}
        {currentScreen === 'splash' && (
          <motion.div
            key="screen-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="relative flex-1 w-full min-h-[640px] flex flex-col overflow-hidden"
          >
            <SplashScreen
              autoDismissDelay={2600}
              onFinish={() => setCurrentScreen('welcome')}
            />
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: WELCOME PAGE (Background: https://postimg.cc/BXQCNbWg)          */}
        {/* ========================================================================= */}
        {currentScreen === 'welcome' && (
          <motion.div
            key="screen-welcome"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-[640px] flex flex-col justify-between overflow-y-auto"
            style={signupBgStyle}
          >
            {/* Top Header Area */}
            <div className="px-6 pt-12 pb-6 text-center space-y-2">
              <h1 className="font-extrabold text-2xl sm:text-[26px] text-zinc-950 tracking-tight leading-snug">
                Welcome to the Club, Bestie! ✨
              </h1>
              <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed max-w-[260px] mx-auto font-normal">
                Drop in, create, and bag your 5,000 won welcome bag instantly!
              </p>
            </div>

            {/* Bottom Sheet Card */}
            <div className="bg-white rounded-t-[36px] shadow-[0_-10px_35px_rgba(0,0,0,0.06)] p-6 sm:p-7 space-y-3.5">
              <form onSubmit={handleFinishSignIn} className="space-y-3.5">
                <FloatingInput
                  label="Email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="Enter Email"
                  required
                />

                <FloatingInput
                  label="Password"
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                />

                {/* Remember me checkbox */}
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center space-x-2 pt-0.5 cursor-pointer select-none px-1"
                >
                  <div className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center transition-colors">
                    {rememberMe && <div className="w-2.5 h-2.5 rounded-full bg-[#B4A7D6]" />}
                  </div>
                  <span className="text-xs text-zinc-600">Remember me</span>
                </div>

                {/* Sign in Button (Lavender Pill with Loading Feedback) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3.5 px-6 bg-[#B4A7D6] hover:bg-[#A697CE] active:scale-95 text-white font-bold text-sm rounded-full transition-all shadow-[0_4px_16px_rgba(180,167,214,0.4)] cursor-pointer mt-1 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </form>

              {/* Social Login Section */}
              <div className="pt-1 text-center">
                <p className="text-xs text-zinc-400 font-medium pb-2.5">
                  or sign in with
                </p>

                <div className="flex items-center justify-center space-x-4">
                  {/* Google Gmail */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onNotify) onNotify('Signed in with Google account!', 'success');
                      setCurrentScreen('loading_club');
                    }}
                    className="w-11 h-11 rounded-full bg-white border border-zinc-200/90 shadow-2xs hover:shadow-xs flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    title="Sign in with Google"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22 6.5l-10 7L2 6.5V18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6.5z" />
                      <path fill="#EA4335" d="M20 4H4C2.9 4 2 4.9 2 6l10 7 10-7c0-1.1-.9-2-2-2z" />
                      <path fill="#FBBC05" d="M2 6.5V8l10 7 10-7V6.5L12 13.5 2 6.5z" opacity="0.3" />
                    </svg>
                  </button>

                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onNotify) onNotify('Connected Instagram Creator account!', 'success');
                      setCurrentScreen('loading_club');
                    }}
                    className="w-11 h-11 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] shadow-2xs hover:shadow-xs flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    title="Sign in with Instagram"
                  >
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* No account yet? Easy Sign up now! */}
              <div className="pt-2 text-center space-y-2">
                <p className="text-xs text-zinc-600 font-medium">
                  No account yet? Easy Sign up now!
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('signup_step1')}
                  className="w-full min-h-[48px] py-3.5 px-6 bg-[#E8E8E8] hover:bg-[#DDD] active:scale-95 text-zinc-900 font-bold text-sm rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  Sign Up (Takes 30 seconds)
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: GET STARTED (Step 1 of 3: Account Details)                      */}
        {/* ========================================================================= */}
        {currentScreen === 'signup_step1' && (
          <motion.div
            key="screen-step1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-[640px] flex flex-col justify-between overflow-y-auto"
            style={signupBgStyle}
          >
            {/* Top Back Nav */}
            <div className="px-5 pt-4">
              <button
                type="button"
                onClick={() => setCurrentScreen('welcome')}
                className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-xs flex items-center justify-center text-zinc-700 hover:text-black cursor-pointer shadow-2xs active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Sheet Card */}
            <div className="bg-white rounded-t-[36px] shadow-[0_-10px_35px_rgba(0,0,0,0.06)] p-6 sm:p-7 space-y-3.5">
              {/* Step indicator */}
              <StepIndicator currentStep={1} />

              <div className="text-center space-y-1">
                <h2 className="font-extrabold text-2xl text-zinc-950 tracking-tight">
                  Get Started
                </h2>
                <p className="text-xs text-zinc-500 font-normal">
                  Create your bestie profile in seconds
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-3.5 pt-1">
                <FloatingInput
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter Full Name"
                  required
                />

                <FloatingInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  required
                />

                <FloatingInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                />

                {/* Terms Checkbox */}
                <div
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="flex items-start space-x-2 pt-1 cursor-pointer select-none px-1"
                >
                  <div className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center mt-0.5">
                    {agreedToTerms && <div className="w-2.5 h-2.5 rounded-full bg-[#B4A7D6]" />}
                  </div>
                  <span className="text-[11.5px] text-zinc-600 leading-snug">
                    I agree with the <strong className="text-zinc-900 font-bold">Terms of Service</strong> and <strong className="text-zinc-900 font-bold">Privacy Policy</strong>
                  </span>
                </div>

                {/* Sign Up Button (Lavender Pill with Loading Feedback) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3.5 px-6 bg-[#B4A7D6] hover:bg-[#A697CE] active:scale-95 text-white font-bold text-sm rounded-full transition-all shadow-[0_4px_16px_rgba(180,167,214,0.4)] cursor-pointer mt-1 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Account...</span>
                    </>
                  ) : (
                    <span>Next: Creator Vibe →</span>
                  )}
                </button>
              </form>

              {/* Social Login Section */}
              <div className="pt-0.5 text-center">
                <p className="text-[11px] text-zinc-400 font-medium pb-2">
                  Or instant sign up with
                </p>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('signup_step2')}
                    className="w-10 h-10 rounded-full bg-white border border-zinc-200/90 shadow-2xs hover:shadow-xs flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22 6.5l-10 7L2 6.5V18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6.5z" />
                      <path fill="#EA4335" d="M20 4H4C2.9 4 2 4.9 2 6l10 7 10-7c0-1.1-.9-2-2-2z" />
                      <path fill="#FBBC05" d="M2 6.5V8l10 7 10-7V6.5L12 13.5 2 6.5z" opacity="0.3" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentScreen('signup_step2')}
                    className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] shadow-2xs hover:shadow-xs flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: CREATOR VIBE (Step 2 of 3 - Friction Reduced Handles & Vibe)    */}
        {/* ========================================================================= */}
        {currentScreen === 'signup_step2' && (
          <motion.div
            key="screen-step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-[640px] flex flex-col justify-between p-6 overflow-y-auto"
            style={whiteBgStyle}
          >
            {/* Top Back Nav */}
            <div className="relative z-10">
              <button
                type="button"
                onClick={() => setCurrentScreen('signup_step1')}
                className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-zinc-700 hover:text-black cursor-pointer shadow-2xs border border-zinc-200/60 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Center Content */}
            <div className="relative z-10 max-w-sm w-full mx-auto my-auto space-y-3.5 py-1">
              {/* Step indicator */}
              <StepIndicator currentStep={2} />

              <div className="text-center space-y-1">
                <h2 className="font-extrabold text-2xl text-zinc-950 tracking-tight">
                  Tell us your creator vibe! ✨
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-600 font-normal">
                  Help brands match you with dream campaigns
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-3 pt-1">
                {/* 1. GENDER (Option: Male, Female, Prefer not to say - Required) */}
                <div className="relative">
                  <label className="absolute -top-2 left-4 px-1.5 bg-white text-[11px] font-medium text-zinc-500 rounded-xs z-10 pointer-events-none select-none">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    required
                    className="w-full min-h-[48px] px-4 py-3 bg-white rounded-full text-xs font-medium text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-1.5 focus:ring-[#B4A7D6] shadow-2xs appearance-none cursor-pointer pr-10"
                  >
                    <option value="" disabled>Choose your Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* 2. NATIONALITY (Text with auto-suggestions - Required) */}
                <div className="relative">
                  <label className="absolute -top-2 left-4 px-1.5 bg-white text-[11px] font-medium text-zinc-500 rounded-xs z-10 pointer-events-none select-none">
                    Nationality <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => {
                      setNationality(e.target.value);
                      setShowNationalitySuggestions(true);
                    }}
                    onFocus={() => setShowNationalitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowNationalitySuggestions(false), 220)}
                    placeholder="Choose your Nationality"
                    required
                    className="w-full min-h-[48px] px-4 py-3 bg-white rounded-full text-xs font-medium text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-1.5 focus:ring-[#B4A7D6] placeholder:text-zinc-300 shadow-2xs transition-all"
                  />
                  {showNationalitySuggestions && filteredNationalities.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto p-1.5 space-y-0.5">
                      {filteredNationalities.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onMouseDown={() => {
                            setNationality(item);
                            setShowNationalitySuggestions(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs rounded-xl hover:bg-zinc-100 text-zinc-800 font-medium flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span>{item}</span>
                          {nationality.toLowerCase() === item.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-[#B4A7D6]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. INSTAGRAM HANDLE with Fixed @ Prefix (Friction-Free Typing/Pasting) */}
                <SocialHandleInput
                  label="Instagram Handle"
                  value={instagramHandle}
                  onChange={setInstagramHandle}
                  placeholder="yourhandle"
                  required
                />

                {/* 4. TIKTOK HANDLE with Fixed @ Prefix (Optional) */}
                <SocialHandleInput
                  label="Tiktok Handle (Optional)"
                  value={tiktokHandle}
                  onChange={setTiktokHandle}
                  placeholder="yourhandle (optional)"
                />

                {/* 5. CONTENT CATEGORY (Multi-select list with clear counter badge) */}
                <div className="relative">
                  <label className="absolute -top-2 left-4 px-1.5 bg-white text-[11px] font-medium text-zinc-500 rounded-xs z-10 pointer-events-none select-none">
                    Content Category <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="w-full min-h-[48px] px-4 py-3 bg-white rounded-full text-xs font-medium text-left border border-zinc-200 focus:outline-none focus:ring-1.5 focus:ring-[#B4A7D6] shadow-2xs flex items-center justify-between cursor-pointer active:scale-99"
                  >
                    <span className="truncate text-zinc-900 pr-2">
                      {selectedCategories.length > 0
                        ? selectedCategories.join(', ')
                        : 'Choose your type of content'}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold bg-[#B4A7D6]/20 text-[#7C6CA6] px-2.5 py-0.5 rounded-full">
                      {selectedCategories.length} selected
                    </span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] py-3.5 px-6 bg-[#B4A7D6] hover:bg-[#A697CE] active:scale-95 text-white font-bold text-sm rounded-full transition-all shadow-[0_4px_16px_rgba(180,167,214,0.4)] cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Vibe...</span>
                      </>
                    ) : (
                      <span>Next: PR Delivery (Optional) →</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Content Category Modal Sheet */}
            <AnimatePresence>
              {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-100 space-y-4 max-h-[85vh] flex flex-col"
                  >
                    <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center space-x-1">
                          <span>Type of Content</span>
                          <span className="text-rose-500">*</span>
                        </h3>
                        <p className="text-xs text-zinc-500 pt-0.5 font-normal">
                          (Respondents can select as many as they like)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(false)}
                        className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Category Options Checklist */}
                    <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
                      {CONTENT_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                          <div
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer select-none min-h-[48px] ${
                              isSelected
                                ? 'border-[#B4A7D6] bg-[#B4A7D6]/10 text-zinc-950 font-semibold shadow-2xs'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-[#B4A7D6] border-[#B4A7D6] text-white'
                                  : 'border-zinc-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </div>
                            <span className="text-sm">{cat}</span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="w-full min-h-[48px] py-3.5 bg-[#B4A7D6] hover:bg-[#A697CE] active:scale-95 text-white font-bold text-sm rounded-full transition-all shadow-md cursor-pointer"
                    >
                      Done ({selectedCategories.length} selected)
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: SEND MY GOODIES TO.. (Step 3 of 3 - With Clear "Skip" Option)   */}
        {/* ========================================================================= */}
        {currentScreen === 'signup_shipping' && (
          <motion.div
            key="screen-shipping"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-[640px] flex flex-col justify-between p-6 overflow-y-auto"
            style={whiteBgStyle}
          >
            {/* Top Navigation Bar with Clear Skip Button */}
            <div className="relative z-10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentScreen('signup_step2')}
                className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-zinc-700 hover:text-black cursor-pointer shadow-2xs border border-zinc-200/60 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSkipShipping}
                className="px-3.5 py-1.5 rounded-full bg-white/95 text-xs font-bold text-[#8C7AB8] hover:text-[#7C6CA6] hover:bg-white border border-[#B4A7D6]/40 shadow-2xs transition-all active:scale-95 flex items-center space-x-1 cursor-pointer"
              >
                <span>Skip for now</span>
                <span>→</span>
              </button>
            </div>

            {/* Center Content */}
            <div className="relative z-10 max-w-sm w-full mx-auto my-auto space-y-3.5 py-1">
              {/* Step indicator */}
              <StepIndicator currentStep={3} />

              <div className="text-center space-y-1">
                <h2 className="font-extrabold text-2xl text-zinc-950 tracking-tight">
                  Send my goodies to.. 🎁
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-600 font-normal">
                  For your campaign gifts & PR boxes
                </p>
              </div>

              {/* Zero-Friction Reassuring Banner */}
              <div className="bg-[#B4A7D6]/15 border border-[#B4A7D6]/35 rounded-2xl p-2.5 text-center flex items-center space-x-2">
                <Gift className="w-4 h-4 text-[#8C7AB8] shrink-0" />
                <p className="text-[11px] text-[#5C4D80] font-medium leading-snug text-left">
                  <strong>Optional for now!</strong> You can save this now or skip and fill later in your profile when claiming PR boxes.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  setTimeout(() => {
                    setIsSubmitting(false);
                    setCurrentScreen('signup_step3');
                  }, 240);
                }}
                className="space-y-3 pt-1"
              >
                <FloatingInput
                  label="Road Name Address"
                  type="text"
                  value={roadAddress}
                  onChange={(e) => setRoadAddress(e.target.value)}
                  placeholder="Enter your road name address"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <FloatingInput
                    label="Detail Address"
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="Home Details"
                  />

                  <FloatingInput
                    label="Postal Code"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Postal Code"
                  />
                </div>

                {/* Courier Delivery Note */}
                <div className="relative">
                  <label className="absolute -top-2 left-4 px-1.5 bg-white text-[11px] font-medium text-zinc-500 rounded-xs z-10 pointer-events-none select-none">
                    Courier Delivery Note
                  </label>
                  <select
                    value={courierNote}
                    onChange={(e) => setCourierNote(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-3 bg-white rounded-full text-xs font-medium text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-1.5 focus:ring-[#B4A7D6] shadow-2xs appearance-none cursor-pointer pr-10"
                  >
                    {COURIER_NOTE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <FloatingInput
                  label="Korean Phone Number"
                  type="tel"
                  value={koreanPhone}
                  onChange={(e) => setKoreanPhone(e.target.value)}
                  placeholder="Enter your Korean phone number"
                />

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] py-3.5 px-6 bg-[#B4A7D6] hover:bg-[#A697CE] active:scale-95 text-white font-bold text-sm rounded-full transition-all shadow-[0_4px_16px_rgba(180,167,214,0.4)] cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Address...</span>
                      </>
                    ) : (
                      <span>Save Address & Continue →</span>
                    )}
                  </button>

                  {/* High Visibility Skip for Now Button */}
                  <button
                    type="button"
                    onClick={handleSkipShipping}
                    className="w-full min-h-[48px] py-3.5 px-6 bg-white hover:bg-zinc-50 active:scale-95 text-zinc-700 font-bold text-sm rounded-full transition-all cursor-pointer border border-zinc-200 shadow-2xs"
                  >
                    Skip for now / Fill later in Profile
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 6: REFERRAL CODE (Celebratory Bonus Unlock)                        */}
        {/* ========================================================================= */}
        {currentScreen === 'signup_step3' && (
          <motion.div
            key="screen-step3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-[640px] flex flex-col justify-between p-6 overflow-y-auto"
            style={whiteBgStyle}
          >
            {/* Top Back Nav */}
            <div className="relative z-10">
              <button
                type="button"
                onClick={() => setCurrentScreen('signup_shipping')}
                className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-zinc-700 hover:text-black cursor-pointer shadow-2xs border border-zinc-200/60 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Center Content */}
            <div className="relative z-10 max-w-sm w-full mx-auto my-auto space-y-4 py-4 text-center">
              <div className="space-y-1.5 pb-1">
                <div className="inline-flex items-center space-x-1 bg-[#B4A7D6]/20 text-[#7C6CA6] px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bonus Reward Step</span>
                </div>
                <h2 className="font-extrabold text-2xl text-zinc-950 tracking-tight">
                  Have a Referral Code?
                </h2>
                <p className="text-sm text-zinc-600 font-normal">
                  Unlock an extra <strong className="text-zinc-900 font-bold">₩3,000 won</strong> instantly for your creator wallet!
                </p>
              </div>

              <form onSubmit={handleApplyReferral} className="space-y-3 pt-1">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter Referral Code (e.g. BESTIE2026)"
                  className="w-full min-h-[48px] px-5 py-3.5 bg-white rounded-full text-xs font-semibold text-center text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-1.5 focus:ring-[#B4A7D6] placeholder:text-zinc-300 shadow-2xs tracking-wider"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3.5 px-6 bg-[#B4A7D6] hover:bg-[#A697CE] active:scale-95 text-white font-bold text-sm rounded-full transition-all shadow-[0_4px_16px_rgba(180,167,214,0.4)] cursor-pointer mt-1 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Apply Code & Claim +₩3,000</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipReferral}
                  className="w-full min-h-[48px] py-3.5 px-6 bg-[#EFEFEF] hover:bg-[#E5E5E5] active:scale-95 text-zinc-800 font-bold text-sm rounded-full transition-all cursor-pointer shadow-2xs mt-2"
                >
                  No code / Skip to Club →
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 7: YOU'RE OFFICIALLY IN, BESTIE! (Pure transparent logo, crisp)    */}
        {/* Background: https://postimg.cc/gXT7dhPz                                   */}
        {/* ========================================================================= */}
        {currentScreen === 'loading_club' && (
          <motion.div
            key="screen-club"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex-1 min-h-[640px] flex flex-col justify-center items-center p-6 text-center select-none overflow-y-auto"
            style={whiteBgStyle}
          >
            <div className="relative z-10 max-w-sm w-full mx-auto space-y-6 my-auto flex flex-col items-center">
              {/* Retyped Clean Typography */}
              <div className="space-y-1.5">
                <h1 className="font-extrabold text-2xl sm:text-[28px] text-zinc-950 tracking-tight leading-snug">
                  You're officially in, bestie! 🥳
                </h1>
                <p className="text-sm sm:text-[15px] text-zinc-600 font-normal">
                  Welcome to the creative club
                </p>
              </div>

              {/* Brand Logo in the middle (pure transparent logo, no white background) */}
              <div className="py-2 flex justify-center items-center">
                <VivelyLogo className="w-32 sm:w-36 h-auto" />
              </div>

              {/* Retyped & Created Button */}
              <button
                type="button"
                onClick={handleFinishFinal}
                disabled={isSubmitting}
                className="min-h-[48px] py-3.5 px-10 bg-[#B4A7D6] hover:bg-[#A697CE] active:scale-95 text-white font-bold text-sm sm:text-base rounded-full transition-all shadow-[0_6px_22px_rgba(180,167,214,0.45)] cursor-pointer flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entering Club...</span>
                  </>
                ) : (
                  <span>Enter Club →</span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
