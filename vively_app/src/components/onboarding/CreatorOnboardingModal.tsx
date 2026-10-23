import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Sparkles, MapPin, Instagram, Youtube, Video, Package, 
  ArrowRight, Check, CheckCircle2, ChevronLeft 
} from 'lucide-react';
import { UserProfile, ContentNiche, FollowerRange } from '../../types';
import confetti from 'canvas-confetti';

interface CreatorOnboardingModalProps {
  isOpen: boolean;
  userEmail: string;
  onComplete: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const CreatorOnboardingModal: React.FC<CreatorOnboardingModalProps> = ({
  isOpen,
  userEmail,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  // Step 2: Creator Profile & Niches
  const [niche, setNiche] = useState<ContentNiche>('K-Beauty');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [followerRange, setFollowerRange] = useState<FollowerRange>('1K - 10K');

  // Step 3: Shipping Address (For PR Packages)
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shipCountry, setShipCountry] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  if (!isOpen) return null;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFullName = fullName.trim();
    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName: cleanFullName,
      displayName: cleanFullName ? cleanFullName.split(' ')[0] : 'Creator',
      email: userEmail || '',
      phoneNumber,
      gender,
      dateOfBirth,
      city: shipCity || city,
      country: shipCountry || country,
      avatarUrl: '',
      bio,
      niche,
      socialHandles: {
        instagram: instagram ? (instagram.startsWith('@') ? instagram : `@${instagram}`) : '',
        tiktok: tiktok ? (tiktok.startsWith('@') ? tiktok : `@${tiktok}`) : '',
        youtube,
      },
      followerRange,
      totalFollowers: '0',
      engagementRate: '0%',
      onTimeDeliveryRate: '100%',
      shippingAddress: {
        street,
        unit,
        city: shipCity || city,
        stateProvince,
        postalCode,
        country: shipCountry || country,
        deliveryNotes,
      },
      isOnboarded: true,
      savedCampaignIds: [],
    };

    confetti({ particleCount: 70, spread: 80 });
    onComplete(profile);
  };

  const niches: ContentNiche[] = ['K-Beauty', 'Fashion', 'Food/Cafe', 'Travel', 'Lifestyle'];
  const followerRanges: FollowerRange[] = ['1K - 10K', '10K - 50K', '50K - 100K', '100K - 500K', '500K+'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Progress Header */}
        <div className="px-6 pt-5 pb-3 bg-zinc-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-black">
              Creator Onboarding · Step {step} of 3
            </span>
            <span className="text-xs font-bold text-zinc-500">
              {step === 1 ? 'Personal Info' : step === 2 ? 'Social & Niche' : 'PR Shipping Address'}
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="flex space-x-1.5 h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-black rounded-full transition-all duration-300 ${
                step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
              }`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-vively font-extrabold text-lg text-black">
                  Tell us about yourself
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Brands require verified creator profiles for tax and legal collaboration safety.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Full Name (Legal or Creator Name)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Your Name"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Phone Number (with country code)
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+82 10-1234-5678"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Current Location / City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Seoul, Tokyo, LA..."
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="South Korea"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Continue to Creator Profile</span>
                  <ArrowRight className="w-4 h-4 text-[#B5A8DE]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Creator Profile & Socials */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-vively font-extrabold text-lg text-black">
                  Creator Niche & Handles
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select your primary content genre and connect your channels.
                </p>
              </div>

              {/* Niches Chips */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1.5">
                  Primary Content Niche
                </label>
                <div className="flex flex-wrap gap-2">
                  {niches.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNiche(n)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        niche === n
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Handles */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-zinc-700 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@yourhandle"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    TikTok Handle
                  </label>
                  <div className="relative">
                    <Video className="w-4 h-4 text-black absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="@your.tiktok"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    YouTube Channel (Optional)
                  </label>
                  <div className="relative">
                    <Youtube className="w-4 h-4 text-red-600 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="Channel Name"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Follower Range */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1.5">
                  Total Reach / Follower Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {followerRanges.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setFollowerRange(range)}
                      className={`p-2 rounded-xl text-xs font-semibold text-center transition-all ${
                        followerRange === range
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Short Bio for Korean Brand Directors
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Introduce your aesthetic and favorite content topics..."
                  className="w-full p-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Continue to Shipping Address</span>
                  <ArrowRight className="w-4 h-4 text-[#B5A8DE]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Shipping Address for PR Packages */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center space-x-1.5 text-black mb-1">
                  <Package className="w-4 h-4 text-[#5B4E8C]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">PR Package Logistics</span>
                </div>
                <h3 className="font-vively font-extrabold text-lg text-black">
                  Where should brands ship samples?
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Korean skincare & fashion PR boxes are shipped via DHL or CJ Korea Post directly to your doorstep.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street name and building number"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Apartment, Suite, Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. Apt 4B, Room 302"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={shipCity}
                    onChange={(e) => setShipCity(e.target.value)}
                    placeholder="Seoul"
                    className="w-full px-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="04781"
                    className="w-full px-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    required
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    placeholder="Seoul Special City"
                    className="w-full px-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={shipCountry}
                    onChange={(e) => setShipCountry(e.target.value)}
                    placeholder="South Korea"
                    className="w-full px-3 py-2 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Delivery Notes / Courier Entry Code
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Door passcode or leave at front desk"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 rounded-xl focus:ring-2 focus:ring-[#B5A8DE] focus:outline-none"
                />
              </div>

              {/* Starter Bonus Callout */}
              <div className="p-3 bg-zinc-50 rounded-2xl flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-[#7E71AA] shrink-0" />
                <div className="text-xs text-zinc-700">
                  <span className="font-bold text-black">Companion Gift:</span> Complete profile to awaken your 3D Plant companion and receive <strong>+100 Plant EXP Starter Boost</strong>!
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex-1 py-3 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#B5A8DE]" />
                  <span>Launch Creator Profile</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
