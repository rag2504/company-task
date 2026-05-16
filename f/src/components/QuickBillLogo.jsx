import React from 'react';

function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M24 6L40 16v16L24 42 8 32V16L24 6z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M24 6v18M8 16l16 10M40 16L24 26M8 32l16-10M40 32L24 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M24 24v18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/**
 * QuickBill brand mark — click navigates to home when `onHome` is passed.
 */
export default function QuickBillLogo({
  darkMode = false,
  onHome,
  showTagline = true,
  size = 'md',
  className = '',
}) {
  const iconClass = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const titleClass =
    size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl';
  const tagClass =
    size === 'lg' ? 'text-xs' : 'text-[10px] sm:text-[11px]';

  const iconColor = darkMode ? 'text-blue-400' : 'text-blue-600';
  const titleColor = darkMode ? 'text-white' : 'text-slate-900';
  const tagColor = darkMode ? 'text-gray-500' : 'text-gray-500';

  const inner = (
    <>
      <div
        className={`flex-shrink-0 transition-transform duration-200 ${onHome ? 'group-hover:scale-105 group-hover:-rotate-3' : ''} ${iconColor}`}
      >
        <LogoMark className={iconClass} />
      </div>
      <div className="text-left leading-tight">
        <span
          className={`block font-bold tracking-tight ${titleClass} ${titleColor}`}
        >
          QuickBill
        </span>
        {showTagline && (
          <span
            className={`block uppercase tracking-[0.18em] font-medium ${tagClass} ${tagColor}`}
          >
            Point of Sale System
          </span>
        )}
      </div>
    </>
  );

  if (onHome) {
    return (
      <button
        type="button"
        onClick={onHome}
        className={`group flex items-center gap-3 rounded-lg px-1 py-1 -ml-1 transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${darkMode ? 'focus-visible:ring-offset-gray-800' : 'focus-visible:ring-offset-white'} ${className}`}
        aria-label="QuickBill home — go to Overview"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>{inner}</div>
  );
}
