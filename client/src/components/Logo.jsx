import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * SR Brand Logo Component:
 * - Employs official /logo.png luxury gold & black crown monogram
 * - Clean, borderless floating emblem
 * - Emphasizes iconic emblem without redundant "SR Marketplace" text
 * - Supports marketplace, vendor, admin, iconOnly, and hero variants
 */
const Logo = ({
  variant = 'marketplace', // 'marketplace' | 'vendor' | 'admin' | 'iconOnly' | 'hero'
  theme = 'light',         // 'light' (white background) | 'dark' (navy sidebar)
  size = 'md',             // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  linkTo,
  showText = false,        // Default false to show only the iconic emblem without "SR Marketplace" text
  showTagline = false,
  animated = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const isDark = theme === 'dark';

  // Proportional sizing tokens for prominent, crisp emblem presentation
  const sizeMap = {
    xs: {
      img: 'w-8 h-8 sm:w-9 sm:h-9',
      title: 'text-base sm:text-lg',
      sub: 'text-[9px]',
      gap: 'gap-2',
    },
    sm: {
      img: 'w-10 h-10 sm:w-12 sm:h-12',
      title: 'text-lg sm:text-xl',
      sub: 'text-[10px]',
      gap: 'gap-2.5',
    },
    md: {
      img: 'w-14 h-14 sm:w-16 sm:h-16',
      title: 'text-xl sm:text-2xl',
      sub: 'text-[11px]',
      gap: 'gap-3',
    },
    lg: {
      img: 'w-20 h-20 sm:w-24 sm:h-24',
      title: 'text-2xl sm:text-3xl',
      sub: 'text-xs',
      gap: 'gap-3.5',
    },
    xl: {
      img: 'w-28 h-28 sm:w-32 sm:h-32',
      title: 'text-3xl sm:text-4xl',
      sub: 'text-sm',
      gap: 'gap-4',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Determine default target destination if not specified
  let targetLink = linkTo;
  if (targetLink === undefined) {
    if (variant === 'vendor') targetLink = '/vendor/dashboard';
    else if (variant === 'admin') targetLink = '/admin/dashboard';
    else targetLink = '/';
  }

  const Wrapper = targetLink ? Link : 'div';
  const wrapperProps = targetLink ? { to: targetLink } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`inline-flex items-center ${currentSize.gap} group select-none transition-all duration-200 ${
        targetLink ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* 1. Borderless, Prominent Floating SR Emblem */}
      <div
        className={`relative flex-shrink-0 flex items-center justify-center transition-transform duration-200 ${
          animated ? 'group-hover:scale-105' : ''
        }`}
      >
        {!imgError ? (
          <img
            src="/logo.png"
            alt="SR Logo"
            onError={() => setImgError(true)}
            className={`${currentSize.img} object-contain transition-transform duration-200 filter drop-shadow-xs`}
            loading="eager"
          />
        ) : (
          <div
            className={`${currentSize.img} rounded-lg bg-gradient-to-tr from-[#92400e] via-[#d97706] to-[#fde047] flex items-center justify-center text-white font-black text-lg shadow-sm`}
          >
            SR
          </div>
        )}
      </div>

      {/* 2. Optional Variant Badges or Brand Text */}
      {(showText || variant === 'vendor' || variant === 'admin') && variant !== 'iconOnly' && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-2 flex-wrap">
            {showText && (
              <span
                className={`font-black tracking-tight ${currentSize.title} ${
                  isDark ? 'text-white' : 'text-[#0c2a5e]'
                }`}
              >
                <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 bg-clip-text text-transparent font-black">
                  SR
                </span>
                <span className={isDark ? 'text-white ml-1.5' : 'text-[#0c2a5e] ml-1.5'}>
                  Marketplace
                </span>
              </span>
            )}

            {/* Variant Specific Badges */}
            {variant === 'vendor' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 uppercase tracking-wider shadow-xs">
                Vendor Hub
              </span>
            )}

            {variant === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-indigo-600 to-indigo-700 text-white uppercase tracking-wider shadow-xs">
                Admin Console
              </span>
            )}
          </div>

          {/* Optional Subtext / Tagline */}
          {showTagline && (
            <span
              className={`font-bold tracking-[0.18em] uppercase ${currentSize.sub} ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              } flex items-center gap-1 mt-0.5`}
            >
              <span>DREAM</span>
              <span className="text-amber-500">•</span>
              <span>GROW</span>
              <span className="text-amber-500">•</span>
              <span>TOGETHER</span>
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
};

export default Logo;
