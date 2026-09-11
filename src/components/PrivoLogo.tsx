import React from 'react';

interface PrivoLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const PrivoLogo: React.FC<PrivoLogoProps> = ({ className = "w-8 h-8", size = 32, glow = false }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-slate-400/20 rounded-xl blur-md -z-10 animate-pulse" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
      >
        {/* Background dark rounded box */}
        <rect width="100" height="100" rx="20" fill="#080B10" />
        <rect x="2" y="2" width="96" height="96" rx="18" stroke="#1E293B" strokeWidth="1.5" />

        {/* Barbed Wire Speech Bubble Outline */}
        <defs>
          <linearGradient id="barbMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="wireTwist" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <filter id="wireShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Main double twisted wire rectangular path */}
        <g filter="url(#wireShadow)">
          {/* Wire strand 1 */}
          <path
            d="M 22 25 L 78 25 L 78 65 L 72 65 L 76 80 L 62 65 L 22 65 Z"
            stroke="url(#barbMetallic)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Wire strand 2 (intertwined second line) */}
          <path
            d="M 24 23 L 76 23 L 76 63 L 70 63 L 74 77 L 60 63 L 24 63 Z"
            stroke="url(#wireTwist)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="4 2"
          />

          {/* Barb 1: Top Left */}
          <g transform="translate(32, 24)">
            <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill="#64748B" />
          </g>

          {/* Barb 2: Top Center */}
          <g transform="translate(50, 24)">
            <path d="M -6 -7 L 6 7 M -7 6 L 7 -6" stroke="#F1F5F9" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2.2" fill="#475569" />
          </g>

          {/* Barb 3: Top Right */}
          <g transform="translate(68, 24)">
            <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill="#64748B" />
          </g>

          {/* Barb 4: Right Top */}
          <g transform="translate(77, 36)">
            <path d="M -7 -6 L 7 6 M -6 7 L 6 -7" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill="#475569" />
          </g>

          {/* Barb 5: Right Center */}
          <g transform="translate(77, 52)">
            <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2.2" fill="#64748B" />
          </g>

          {/* Barb 6: Tail Joint */}
          <g transform="translate(71, 70)">
            <path d="M -7 -5 L 7 5 M -5 7 L 5 -7" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill="#334155" />
          </g>

          {/* Barb 7: Bottom Right */}
          <g transform="translate(56, 64)">
            <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill="#475569" />
          </g>

          {/* Barb 8: Bottom Left */}
          <g transform="translate(36, 64)">
            <path d="M -7 -6 L 7 6 M -6 7 L 6 -7" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2.2" fill="#64748B" />
          </g>

          {/* Barb 9: Left Center */}
          <g transform="translate(23, 44)">
            <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill="#475569" />
          </g>

          {/* Inner metallic wire coils around barbs */}
          <path d="M 30 22 C 32 26, 34 22, 36 26" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M 48 22 C 50 26, 52 22, 54 26" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M 66 22 C 68 26, 70 22, 72 26" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M 75 34 C 79 36, 75 38, 79 40" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M 75 50 C 79 52, 75 54, 79 56" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M 54 62 C 56 66, 58 62, 60 66" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M 34 62 C 36 66, 38 62, 40 66" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M 21 42 C 25 44, 21 46, 25 48" stroke="#CBD5E1" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};
