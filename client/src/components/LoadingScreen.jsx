import React from 'react';

/**
 * Fast Spinner with Large SR Monogram:
 * - High-speed, lightweight rendering
 * - Prominent large SR Monogram emblem
 * - Smooth golden ring spinner
 * - Clean, minimal status message without redundant text
 */
export const LoadingScreen = ({
  message = 'Loading...',
  fullScreen = true,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center text-center p-6 select-none animate-fadeIn">
      {/* Fast Golden Spinner with Large Center Monogram */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-5">
        {/* Outer Fast Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-[3.5px] border-amber-200/40 border-t-amber-500 animate-spin" />

        {/* Large Center SR Monogram */}
        <div className="w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-white shadow-sm flex items-center justify-center p-2.5">
          <img
            src="/logo.png"
            alt="SR Logo"
            className="w-full h-full object-contain filter drop-shadow-xs"
          />
        </div>
      </div>

      {/* Status Message */}
      <p className="text-sm font-semibold text-slate-500 tracking-wide">
        {message}
      </p>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="w-full py-12 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-xs text-slate-900 transition-opacity duration-200">
      {content}
    </div>
  );
};

/**
 * Fast Inline Page Loader for tab switches & data fetching
 */
export const PageLoader = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-[220px] w-full flex flex-col items-center justify-center p-6 select-none">
      <div className="relative w-20 h-20 flex items-center justify-center mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-amber-200/50 border-t-amber-500 animate-spin" />
        <div className="w-14 h-14 rounded-full bg-white shadow-xs flex items-center justify-center p-1.5">
          <img
            src="/logo.png"
            alt="SR Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <span className="text-xs font-bold text-slate-600 tracking-wider">
        {text}
      </span>
    </div>
  );
};

export default LoadingScreen;
