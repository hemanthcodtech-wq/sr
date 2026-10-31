import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Official Brand Logo Component:
 * - Renders the user's official golden crown SR emblem (/logo.png)
 * - Tightly cropped bounds (410x397) to maximize visibility and scale
 * - Polished golden luminance & warm ambient drop shadow for maximum clarity on dark navy navbar
 * - Sized large, crisp and bold across mobile, tablet and desktop
 */
const Logo = ({
  variant = 'brand', // 'brand' (default user logo) | 'vendor' | 'admin' | 'marketplace' | 'rs'
  theme = 'dark',
  size = 'lg', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  linkTo,
  showTagline = false,
  animated = true,
}) => {
  const isDark = theme === 'dark';

  // Responsive height scale for the golden SR emblem
  const sizeMap = {
    sm: {
      imgH: 'h-10 sm:h-12',
      tagline: 'text-[7px] sm:text-[8px] tracking-[0.2em] mt-0.5',
    },
    md: {
      imgH: 'h-12 sm:h-14',
      tagline: 'text-[8px] sm:text-[9px] tracking-[0.22em] mt-0.5',
    },
    lg: {
      imgH: 'h-14 sm:h-16 md:h-18',
      tagline: 'text-[9px] sm:text-[10px] tracking-[0.25em] mt-1',
    },
    xl: {
      imgH: 'h-18 sm:h-22 md:h-24',
      tagline: 'text-[10px] sm:text-[12px] tracking-[0.28em] mt-1.5',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.lg;

  let targetLink = linkTo;
  if (targetLink === undefined) {
    if (variant === 'vendor') targetLink = '/vendor/dashboard';
    else if (variant === 'admin') targetLink = '/admin/dashboard';
    else targetLink = '/';
  }

  const Wrapper = targetLink ? Link : 'div';
  const wrapperProps = targetLink ? { to: targetLink } : {};

  // If RS vector emblem is explicitly requested
  if (variant === 'rs') {
    return (
      <Wrapper
        {...wrapperProps}
        className={`inline-flex flex-col items-center justify-center select-none transition-all duration-200 ${
          targetLink ? 'cursor-pointer' : ''
        } ${className}`}
        aria-label="RS Marketplace"
      >
        <div className="relative flex items-center justify-center font-black select-none tracking-tight leading-none px-1">
          <span
            style={{ color: '#ffb703', fontFamily: "'Impact', 'Arial Black', -apple-system, sans-serif" }}
            className="font-black inline-block bg-gradient-to-b from-[#fff385] via-[#ffc800] to-[#d97706] bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)] text-3.5xl sm:text-4xl"
          >
            R
          </span>
          <span
            style={{ color: '#0ea5e9', fontFamily: "'Impact', 'Arial Black', -apple-system, sans-serif" }}
            className="font-black inline-block bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(14,165,233,0.4)] -ml-0.5 text-3.5xl sm:text-4xl"
          >
            S
          </span>
        </div>
        {showTagline && (
          <span className="font-black uppercase text-white tracking-[0.25em] text-[8.5px] mt-1 whitespace-nowrap">
            SHOP • SUPPORT • GROW
          </span>
        )}
      </Wrapper>
    );
  }

  // Primary: Official Golden Crown SR Luxury Logo (/logo.png)
  return (
    <Wrapper
      {...wrapperProps}
      className={`inline-flex flex-col items-center justify-center group select-none transition-all duration-200 ${
        targetLink ? 'cursor-pointer' : ''
      } ${className}`}
      aria-label="SR Multi-Vendor Marketplace"
    >
      <div
        className={`relative flex items-center justify-center transition-transform duration-200 ${
          animated ? 'group-hover:scale-105 active:scale-95' : ''
        }`}
      >
        <img
          src="/logo.png"
          alt="SR Logo"
          className={`${currentSize.imgH} w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(245,158,11,0.55)] brightness-105`}
          loading="eager"
        />
      </div>

      {/* Optional Tagline */}
      {showTagline && (
        <span
          className={`font-black uppercase whitespace-nowrap drop-shadow-xs text-amber-300/95 tracking-[0.25em] ${currentSize.tagline}`}
        >
          DREAM  •  GROW  •  TOGETHER
        </span>
      )}

      {/* Optional Badges */}
      {variant === 'vendor' && (
        <span className="mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 uppercase tracking-wider shadow-xs">
          Vendor Hub
        </span>
      )}
      {variant === 'admin' && (
        <span className="mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white uppercase tracking-wider shadow-xs">
          Admin Console
        </span>
      )}
    </Wrapper>
  );
};

export default Logo;