import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { UserProfile } from '../../types';

interface CustomerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'exp') => void;
}

// 12-point scalloped verified badge matching Instagram official look
const VerifiedBadge: React.FC = () => (
  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 inline-block" viewBox="0 0 24 24" fill="none">
    <path
      d="M10.5 2.5a2 2 0 0 1 3 0l.9.9a2 2 0 0 0 1.9.5l1.2-.4a2 2 0 0 1 2.5 1.5l.3 1.3a2 2 0 0 0 1.3 1.5l1.2.6a2 2 0 0 1 1 2.8l-.6 1.1a2 2 0 0 0 0 2l.6 1.1a2 2 0 0 1-1 2.8l-1.2.6a2 2 0 0 0-1.3 1.5l-.3 1.3a2 2 0 0 1-2.5 1.5l-1.2-.4a2 2 0 0 0-1.9.5l-.9.9a2 2 0 0 1-3 0l-.9-.9a2 2 0 0 0-1.9-.5l-1.2.4a2 2 0 0 1-2.5-1.5l-.3-1.3a2 2 0 0 0-1.3-1.5l-1.2-.6a2 2 0 0 1-1-2.8l.6-1.1a2 2 0 0 0 0-2l-.6-1.1a2 2 0 0 1 1-2.8l1.2-.6a2 2 0 0 0 1.3-1.5l.3-1.3a2 2 0 0 1 2.5-1.5l1.2.4a2 2 0 0 0 1.9-.5l.9-.9z"
      fill="#0095F6"
    />
    <path
      d="M9 12l2 2 4-4"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Authentic KakaoTalk icon badge with yellow background & TALK speech bubble
const KakaoIcon: React.FC = () => (
  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] bg-[#FEE500] flex items-center justify-center shrink-0 shadow-2xs">
    <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
      <path
        d="M20 7C11.716 7 5 12.148 5 18.5c0 4.148 2.852 7.777 7.148 9.704l-1.444 5.333a.6.6 0 0 0 .889.667l6.222-4.148c.704.074 1.444.148 2.185.148 8.284 0 15-5.148 15-11.5S28.284 7 20 7z"
        fill="#181600"
      />
      <text
        x="20"
        y="21.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FEE500"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="8.5"
        letterSpacing="-0.3px"
      >
        TALK
      </text>
    </svg>
  </div>
);

export const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const kakaoChannels = [
    {
      id: 'global-creators',
      title: 'Global Creators Club',
      subtitle: 'invite.kakao.com/tc/zgfvk3TGMd',
      url: 'https://invite.kakao.com/tc/zgfvk3TGMd',
    },
    {
      id: 'jp-creators',
      title: 'Japanese Creators Club',
      subtitle: 'open.kakao.com/o/gNF0O5Gi',
      url: 'https://open.kakao.com/o/gNF0O5Gi',
    },
    {
      id: 'cn-creators',
      title: 'CN/TW/HK Creators Club',
      subtitle: 'invite.kakao.com/tc/e63wTBbCfz',
      url: 'https://invite.kakao.com/tc/e63wTBbCfz',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window Matching Screenshot Design */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white w-full max-w-sm sm:max-w-md rounded-[32px] shadow-2xl border border-zinc-100 overflow-hidden z-10 px-5 py-7 sm:px-7 sm:py-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 active:scale-95 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Profile Section matching Screenshot */}
          <div className="flex flex-col items-center text-center">
            {/* Circular Profile Avatar with "vively" */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border border-zinc-200/90 flex items-center justify-center bg-white shadow-2xs mb-4">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 font-sans">
                vively
              </span>
            </div>

            {/* Handle & Blue Verified Badge */}
            <div className="flex items-center justify-center space-x-1.5 mb-1.5">
              <h2 className="text-xl sm:text-[22px] font-extrabold text-zinc-900 tracking-tight">
                vively.global
              </h2>
              <VerifiedBadge />
            </div>

            {/* Visit Instagram profile link */}
            <a
              href="https://instagram.com/vively.global"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-bold text-zinc-900 hover:text-zinc-600 transition-colors cursor-pointer mb-5"
            >
              Visit Instagram profile
            </a>
          </div>

          {/* Link Pills */}
          <div className="space-y-3 w-full">
            {/* Box 1: Contact us directly! (Kakao Business) */}
            <a
              href="https://pf.kakao.com/_hGDxfX"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-3.5 bg-[#EDF0F3] hover:bg-[#E3E7EC] active:scale-[0.99] p-3.5 sm:p-4 rounded-[22px] transition-all cursor-pointer text-left group"
            >
              {/* Kakao Yellow Icon */}
              <KakaoIcon />

              {/* Text Labels */}
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] sm:text-sm font-bold text-zinc-900 group-hover:text-black leading-snug">
                  Contact us directly!
                </h3>
                <p className="text-xs text-zinc-500 font-normal truncate leading-tight mt-0.5">
                  Kakao Business: pf.kakao.com/_hGDxfX
                </p>
              </div>
            </a>

            {/* Creators Clubs */}
            {kakaoChannels.map((channel) => (
              <a
                key={channel.id}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-3.5 bg-[#EDF0F3] hover:bg-[#E3E7EC] active:scale-[0.99] p-3.5 sm:p-4 rounded-[22px] transition-all cursor-pointer text-left group"
              >
                {/* Kakao Yellow Icon */}
                <KakaoIcon />

                {/* Text Labels */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] sm:text-sm font-bold text-zinc-900 group-hover:text-black leading-snug">
                    {channel.title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-normal truncate leading-tight mt-0.5">
                    {channel.subtitle}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
