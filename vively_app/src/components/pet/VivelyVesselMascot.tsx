import React, { useState } from 'react';
import { motion } from 'motion/react';
import { VesselExpression } from '../../types';

export interface VesselColorPreset {
  id: string;
  name: string;
  desc: string;
  swatch: string;
  border: string;
  stops: [string, string, string, string, string];
  aoColor: string;
  rimColor: string;
}

export const VESSEL_COLOR_PRESETS: Record<string, VesselColorPreset> = {
  white: {
    id: 'white',
    name: 'Porcelain White',
    desc: 'Classic Seoul white ceramic',
    swatch: '#FFFFFF',
    border: '#E4E4E7',
    stops: ['#FFFFFF', '#FAF8F3', '#EFEBE1', '#E2DDD0', '#D5CEC0'],
    aoColor: '#8C8270',
    rimColor: '#D4CDBC',
  },
  pink: {
    id: 'pink',
    name: 'Blossom Rose',
    desc: 'Soft cherry blossom quartz',
    swatch: '#FBCFE8',
    border: '#F472B6',
    stops: ['#FFFFFF', '#FDF2F8', '#FCE7F3', '#FBCFE8', '#F472B6'],
    aoColor: '#DB2777',
    rimColor: '#F9A8D4',
  },
  mint: {
    id: 'mint',
    name: 'Sage Mint',
    desc: 'Gentle celadon herbal green',
    swatch: '#BBF7D0',
    border: '#4ADE80',
    stops: ['#FFFFFF', '#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'],
    aoColor: '#16A34A',
    rimColor: '#86EFAC',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Mist',
    desc: 'Dreamy pastel lilac',
    swatch: '#DDD6FE',
    border: '#A78BFA',
    stops: ['#FFFFFF', '#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE'],
    aoColor: '#7C3AED',
    rimColor: '#C084FC',
  },
  cream: {
    id: 'cream',
    name: 'Butter Cream',
    desc: 'Warm sunny vanilla clay',
    swatch: '#FEF08A',
    border: '#FACC15',
    stops: ['#FFFFFF', '#FEFCE8', '#FEF9C3', '#FEF08A', '#FDE047'],
    aoColor: '#CA8A04',
    rimColor: '#FDE047',
  },
  noir: {
    id: 'noir',
    name: 'Obsidian Noir',
    desc: 'Modern matte black ceramic',
    swatch: '#27272A',
    border: '#18181B',
    stops: ['#52525B', '#3F3F46', '#27272A', '#18181B', '#09090B'],
    aoColor: '#000000',
    rimColor: '#3F3F46',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Terracotta Coral',
    desc: 'Warm earthy peach glow',
    swatch: '#FED7AA',
    border: '#FB923C',
    stops: ['#FFFFFF', '#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74'],
    aoColor: '#EA580C',
    rimColor: '#FDBA74',
  },
};

interface VivelyVesselMascotProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  expression?: VesselExpression;
  variant?: 'sprout' | 'pikmin';
  vesselColor?: string;
  ribbonColor?: string; // Kept for backwards compatibility
  interactive?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

export const VivelyVesselMascot: React.FC<VivelyVesselMascotProps> = ({
  className = '',
  size = 'md',
  expression = 'joyful',
  vesselColor = 'white',
  interactive = true,
  animate = true,
  onClick,
}) => {
  const [isTapped, setIsTapped] = useState(false);

  const colorPreset = VESSEL_COLOR_PRESETS[vesselColor || 'white'] || VESSEL_COLOR_PRESETS.white;
  const gradId = `ceramicBodyGrad_${colorPreset.id}`;
  const isDarkVessel = colorPreset.id === 'noir';
  const faceColor = isDarkVessel ? '#F4F4F5' : '#121316';

  // Size mapping
  const sizeMap = {
    xs: 'w-10 h-10',
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-52 h-52',
    custom: '',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 900);
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer' : ''
      } ${sizeMap[size]} ${className}`}
      title="Vively Mascot · Ceramic Sprout Vessel"
    >
      {/* Main Vector Artwork matching Gemini_Generated_Image_d0eiibd0eiibd0ei.png 100% */}
      <motion.svg
        viewBox="36 10 128 176"
        className="w-full h-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.08)] overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          isTapped
            ? { y: [-8, 0, -4, 0], scale: [1.06, 0.96, 1.02, 1] }
            : animate
            ? { y: [0, -2.5, 0] }
            : {}
        }
        transition={
          isTapped
            ? { duration: 0.6, ease: 'easeOut' }
            : { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
        }
      >
        <defs>
          {/* Dynamic Ceramic Soft Warm 3D Gradient */}
          <linearGradient id={gradId} x1="45" y1="80" x2="155" y2="175" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={colorPreset.stops[0]} />
            <stop offset="18%" stopColor={colorPreset.stops[1]} />
            <stop offset="55%" stopColor={colorPreset.stops[2]} />
            <stop offset="85%" stopColor={colorPreset.stops[3]} />
            <stop offset="100%" stopColor={colorPreset.stops[4]} />
          </linearGradient>

          {/* 3D Soft Ambient Occlusion Under Rim */}
          <linearGradient id={`ceramicRimAO_${colorPreset.id}`} x1="100" y1="90" x2="100" y2="175" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor={colorPreset.aoColor} stopOpacity="0.25" />
          </linearGradient>

          {/* Inner Cavity Depth Shadow */}
          <linearGradient id="innerCavityShadow" x1="100" y1="100" x2="100" y2="132" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BAAF9D" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#D2CABA" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E8E2D7" stopOpacity="0.2" />
          </linearGradient>

          {/* Upper Left Shoulder Specular Sheen (3D Porcelain Luster) */}
          <linearGradient id="shoulderSheen" x1="55" y1="90" x2="85" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Stem Tan/Khaki 3D Ceramic Gradient */}
          <linearGradient id="stemGrad" x1="97" y1="128" x2="103" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#75644D" />
            <stop offset="35%" stopColor="#96846B" />
            <stop offset="70%" stopColor="#B3A289" />
            <stop offset="100%" stopColor="#C4B49C" />
          </linearGradient>

          {/* Fleshy Mint-Green Sprout Leaf 3D Gradient */}
          <linearGradient id="sproutLeafGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7EBF74" />
            <stop offset="35%" stopColor="#ACE0A5" />
            <stop offset="75%" stopColor="#DAF3D4" />
            <stop offset="100%" stopColor="#F5FCF3" />
          </linearGradient>

          {/* Left Leaf Specular Glint */}
          <linearGradient id="leafSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Diffuse Coral Blush Glow */}
          <filter id="diffuseBlush" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>

          {/* Floor Contact Shadow */}
          <radialGradient id="toyFloorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E1E24" stopOpacity="0.25" />
            <stop offset="55%" stopColor="#1E1E24" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#1E1E24" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 0. Floor Contact Shadow */}
        <ellipse cx="100" cy="178" rx="46" ry="6.5" fill="url(#toyFloorShadow)" />

        {/* 1. CERAMIC SPROUT STEM */}
        <path
          d="M 100 126 C 99 108, 97 88, 102 68"
          stroke="url(#stemGrad)"
          strokeWidth="6.2"
          strokeLinecap="round"
        />

        {/* 2. 3 CERAMIC MINT-GREEN SPROUT LEAVES */}
        <motion.g
          animate={animate ? { rotate: [-2, 2, -2] } : {}}
          style={{ originX: '102px', originY: '68px' }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        >
          {/* Small collar knot at stem top */}
          <ellipse cx="102" cy="68" rx="4.5" ry="3" fill="#88C77F" />

          {/* Leaf 1: Left Leaf */}
          <g transform="rotate(-38 102 68)">
            <path
              d="M 102 68 C 88 56, 82 34, 102 24 C 122 34, 116 56, 102 68 Z"
              fill="url(#sproutLeafGrad)"
              stroke="#7EBF74"
              strokeWidth="0.9"
            />
            <path d="M 102 66 L 102 32" stroke="#68A55E" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <path
              d="M 98 62 C 90 52, 88 38, 102 26 C 104 30, 102 46, 98 62 Z"
              fill="url(#leafSheen)"
              opacity="0.65"
            />
          </g>

          {/* Leaf 2: Right Leaf */}
          <g transform="rotate(38 102 68)">
            <path
              d="M 102 68 C 88 56, 82 34, 102 24 C 122 34, 116 56, 102 68 Z"
              fill="url(#sproutLeafGrad)"
              stroke="#7EBF74"
              strokeWidth="0.9"
            />
            <path d="M 102 66 L 102 32" stroke="#68A55E" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <path
              d="M 106 62 C 114 52, 116 38, 102 26 C 100 30, 102 46, 106 62 Z"
              fill="url(#leafSheen)"
              opacity="0.65"
            />
          </g>

          {/* Leaf 3: Center Upright Leaf */}
          <g>
            <path
              d="M 102 68 C 90 54, 91 30, 102 18 C 113 30, 114 54, 102 68 Z"
              fill="url(#sproutLeafGrad)"
              stroke="#7EBF74"
              strokeWidth="0.9"
            />
            <path d="M 102 65 L 102 24" stroke="#68A55E" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
            <path
              d="M 98 60 C 93 48, 94 32, 102 20 C 103 26, 102 44, 98 60 Z"
              fill="url(#leafSheen)"
              opacity="0.75"
            />
          </g>
        </motion.g>

        {/* 3. CERAMIC U-VESSEL BODY WITH DYNAMIC CERAMIC COLOR */}
        <path
          d="
            M 48 108
            C 48 148, 70 172, 100 172
            C 130 172, 152 148, 152 108
            C 152 90, 124 90, 124 108
            C 124 126, 114 130, 100 130
            C 86 130, 76 126, 76 108
            C 76 90, 48 90, 48 108
            Z
          "
          fill={`url(#${gradId})`}
          stroke={colorPreset.rimColor}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* 3D Ambient Occlusion Layer on Base */}
        <path
          d="
            M 48 108
            C 48 148, 70 172, 100 172
            C 130 172, 152 148, 152 108
            C 152 90, 124 90, 124 108
            C 124 126, 114 130, 100 130
            C 86 130, 76 126, 76 108
            C 76 90, 48 90, 48 108
            Z
          "
          fill={`url(#ceramicRimAO_${colorPreset.id})`}
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* 4. INNER SADDLE CAVITY */}
        <ellipse cx="100" cy="115" rx="22" ry="12" fill="url(#innerCavityShadow)" />

        {/* 5. SPECULAR PORCELAIN SHEEN HIGHLIGHTS */}
        <path
          d="
            M 52 108
            C 52 142, 68 162, 90 168
            C 74 162, 62 142, 62 108
            C 62 98, 52 98, 52 108
            Z
          "
          fill="url(#shoulderSheen)"
          opacity="0.9"
        />

        <ellipse cx="62" cy="104" rx="7" ry="5.5" fill="#FFFFFF" fillOpacity="0.85" />
        <ellipse cx="138" cy="104" rx="7" ry="5.5" fill="#FFFFFF" fillOpacity="0.85" />

        {/* 6. DIFFUSE PEACH-ROSE BLUSH CHEEKS */}
        <ellipse
          cx="71"
          cy="146"
          rx="12.5"
          ry="7.5"
          fill="#FB7185"
          fillOpacity={isDarkVessel ? '0.45' : '0.62'}
          filter="url(#diffuseBlush)"
        />
        <ellipse
          cx="129"
          cy="146"
          rx="12.5"
          ry="7.5"
          fill="#FB7185"
          fillOpacity={isDarkVessel ? '0.45' : '0.62'}
          filter="url(#diffuseBlush)"
        />

        {/* 7. KAWAII SHEET FACIAL EXPRESSION */}
        {expression === 'winking' ? (
          <g>
            <circle cx="81" cy="140" r="8.2" fill={faceColor} />
            <circle cx="78.8" cy="137.6" r="3.2" fill="#FFFFFF" />
            <path d="M 112 140 Q 119 133 126 140" stroke={faceColor} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        ) : expression === 'sparkle' ? (
          <g>
            <g transform="translate(81, 140)">
              <polygon points="0,-9 2.5,-2.5 9,0 2.5,2.5 0,9 -2.5,2.5 -9,0 -2.5,-2.5" fill={faceColor} />
              <circle cx="-1.5" cy="-2" r="1.5" fill="#FFFFFF" />
            </g>
            <g transform="translate(119, 140)">
              <polygon points="0,-9 2.5,-2.5 9,0 2.5,2.5 0,9 -2.5,2.5 -9,0 -2.5,-2.5" fill={faceColor} />
              <circle cx="-1.5" cy="-2" r="1.5" fill="#FFFFFF" />
            </g>
          </g>
        ) : expression === 'love' ? (
          <g>
            <path
              d="M 81 143 C 81 143, 73 138, 73 134 C 73 130, 77 129, 81 133 C 85 129, 89 130, 89 134 C 89 138, 81 143, 81 143 Z"
              fill="#F43F5E"
            />
            <path
              d="M 119 143 C 119 143, 111 138, 111 134 C 111 130, 115 129, 119 133 C 123 129, 127 130, 127 134 C 127 138, 119 143, 119 143 Z"
              fill="#F43F5E"
            />
          </g>
        ) : expression === 'sleepy' ? (
          <g>
            <path d="M 74 140 Q 81 145 88 140" stroke={faceColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M 112 140 Q 119 145 126 140" stroke={faceColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          /* Joyful / Default Glossy Anime Eyes */
          <motion.g
            animate={
              animate
                ? {
                    scaleY: [1, 1, 0.08, 1, 0.08, 1, 1, 1, 0.08, 1, 0.08, 1, 1, 1, 1],
                  }
                : {}
            }
            style={{ transformOrigin: '100px 140px' }}
            transition={{
              repeat: Infinity,
              duration: 4.6,
              times: [0, 0.35, 0.42, 0.44, 0.46, 0.48, 0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.92, 0.94, 1],
              ease: 'easeInOut',
            }}
          >
            {/* Left Eye */}
            <g>
              <circle cx="81" cy="140" r="8.2" fill={faceColor} />
              <circle cx="78.8" cy="137.6" r="3.2" fill="#FFFFFF" />
              <circle cx="83.5" cy="143.6" r="1.5" fill="#FFFFFF" fillOpacity="0.9" />
            </g>

            {/* Right Eye */}
            <g>
              <circle cx="119" cy="140" r="8.2" fill={faceColor} />
              <circle cx="116.8" cy="137.6" r="3.2" fill="#FFFFFF" />
              <circle cx="121.5" cy="143.6" r="1.5" fill="#FFFFFF" fillOpacity="0.9" />
            </g>
          </motion.g>
        )}

        {/* Mouth: Bean Smile or Cheeky Tongue */}
        {expression === 'cheeky' ? (
          <g>
            <path d="M 93 144 C 93 151, 107 151, 107 144 Z" fill={faceColor} />
            <path d="M 96 148 C 96 153, 104 153, 104 148 Z" fill="#F43F5E" />
          </g>
        ) : (
          <path
            d="
              M 93 144
              C 93 153, 107 153, 107 144
              C 103 147.5, 97 147.5, 93 144
              Z
            "
            fill={faceColor}
          />
        )}
      </motion.svg>
    </div>
  );
};
