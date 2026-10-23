import React from 'react';

interface UserSilhouetteProps {
  className?: string;
  fill?: string;
}

/**
 * Clean silhouette user icon matching Picture 2 uploaded by user.
 * Replaces the Apple/iPhone person emoji (👤).
 */
export const UserSilhouette: React.FC<UserSilhouetteProps> = ({
  className = 'w-3.5 h-3.5',
  fill = 'currentColor',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      className={`inline-block shrink-0 align-middle ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="6.8" r="4.7" />
      <path d="M3.2 21.2c0-4.6 3.9-7.6 8.8-7.6s8.8 3 8.8 7.6c0 0.4-0.3 0.8-0.8 0.8H4c-0.5 0-0.8-0.4-0.8-0.8z" />
    </svg>
  );
};
