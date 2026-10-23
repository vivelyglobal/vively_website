import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Package, Sparkles, CheckCircle2, DollarSign, Heart, ShieldCheck } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreCampaigns?: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onExploreCampaigns,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '01',
      title: 'Discover & Apply to Live Campaigns',
      description: 'Browse curated K-beauty, fashion, and cafe drops. Filter by Gifted PR, Paid ($150–$2,500+), or Affiliate. Apply with one click using your saved pitch.',
      icon: Sparkles,
      tag: 'Fast 24h Review',
    },
    {
      step: '02',
      title: 'Receive Authentic PR Deliveries',
      description: 'Once accepted, brands ship full-size authentic skincare, beauty, and fashion products directly to your doorstep with tracked global courier shipping.',
      icon: Package,
      tag: '100% Authentic PR',
    },
    {
      step: '03',
      title: 'Post & Share Authentic Content',
      description: 'Create engaging Reels, TikToks, or YouTube Shorts following the campaign brief. Tag the brand and submit your live post URL.',
      icon: CheckCircle2,
      tag: 'Keep Your Creative Freedom',
    },
    {
      step: '04',
      title: 'Instant Cash Payouts & VIP Perks',
      description: 'Your earnings are deposited into your creator wallet within 48 hours of review. Plus, earn Pet EXP to unlock Seoul salon vouchers & VIP dinner invites.',
      icon: DollarSign,
      tag: 'USD / KRW Withdrawal',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal - Clean Stroke-free Design */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B4E8C] bg-[#B5A8DE]/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Creator Guidebook
            </span>
            <h3 className="font-vively font-extrabold text-black text-lg">
              How to Use Vively
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 pb-5 overflow-y-auto space-y-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Vively bridges international creators with South Korea's hottest trendsetting beauty, fashion, and lifestyle brands. Here is how your creator journey works:
          </p>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-zinc-50 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-black text-xs">
                          {item.title}
                        </h4>
                      </div>
                      <span className="inline-block text-[9px] font-bold text-[#5B4E8C] bg-[#B5A8DE]/20 px-2 py-0.5 rounded-full mt-1">
                        {item.tag}
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee Pill */}
          <div className="bg-zinc-100 rounded-2xl p-3.5 flex items-center space-x-3 text-zinc-700">
            <ShieldCheck className="w-5 h-5 text-black shrink-0" />
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-black block">Verified Brand Protection</span>
              Guaranteed escrow payments, direct brand contact, and 100% genuine PR inventory.
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 pt-2 bg-white">
          <button
            onClick={() => {
              onClose();
              if (onExploreCampaigns) onExploreCampaigns();
            }}
            className="w-full py-3 bg-black hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 active:scale-95"
          >
            <span>Start Exploring Campaigns</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
