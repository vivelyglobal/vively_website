import React from 'react';
import { PetStage, PetType } from '../../types';
import { Pet3DCanvas } from './Pet3DCanvas';
import { Sprout } from 'lucide-react';

interface PetAvatarProps {
  stage?: PetStage | string;
  level: number;
  petType?: PetType;
  isEating?: boolean;
  isPetting?: boolean;
  isExcited?: boolean;
  accessories?: {
    collar?: string;
    head?: string;
    glasses?: string;
    neck?: string;
    prop?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  use3D?: boolean;
}

export const PetAvatar: React.FC<PetAvatarProps> = ({
  stage,
  level,
  petType = 'vessel',
  isEating = false,
  isPetting = false,
  accessories,
  size = 'md',
  className = '',
  use3D = false,
}) => {
  if (use3D) {
    return (
      <div className={`relative ${className}`}>
        <Pet3DCanvas
          petType={petType}
          stage={stage}
          level={level}
          collarTheme={(accessories?.collar as any) || 'lavender'}
          isFeeding={isEating}
          isPetting={isPetting}
          height={size === 'hero' ? 260 : size === 'lg' ? 200 : 150}
        />
      </div>
    );
  }

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    hero: 'w-14 h-14',
  }[size];

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    hero: 'w-28 h-28',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-zinc-100 select-none ${sizeClasses} ${className}`}
    >
      <Sprout className={`${iconSizes} text-emerald-600 transition-transform hover:scale-110`} />
      {accessories?.collar && (
        <span
          className="absolute bottom-1 w-2 h-2 rounded-full ring-1 ring-white"
          style={{
            backgroundColor:
              accessories.collar === 'lavender' ? '#B5A8DE' : '#18181B',
          }}
        />
      )}
    </div>
  );
};
