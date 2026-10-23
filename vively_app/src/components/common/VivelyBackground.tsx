import React from 'react';

interface VivelyBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'vibrant';
}

/**
 * Fullscreen application background element at the rearmost layer (z-index: -1)
 * Image source: https://postimg.cc/NKSBkrX9 (direct: https://i.postimg.cc/1z5XPG5H/background.png)
 * CSS: background-size: cover, background-position: center, and z-index: -1.
 */
export const VivelyBackground: React.FC<VivelyBackgroundProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: "url('https://i.postimg.cc/1z5XPG5H/background.png'), url('https://postimg.cc/NKSBkrX9')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: -1,
      }}
      data-background-url="https://postimg.cc/NKSBkrX9"
      aria-hidden="true"
    />
  );
};
