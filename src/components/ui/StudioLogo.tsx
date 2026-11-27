"use client";

import React from "react";

interface StudioLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  withBadge?: boolean;
}

/**
 * StudioLogo: Custom branded Content Studio logo icon adhering to the Friendly UI design system.
 * Features an organic rounded squircle with Manan's signature pastel cream/amber & coral gradient,
 * a clean minimalist play/creator aperture icon, and high-contrast ink accents.
 */
export function StudioLogo({
  size = "md",
  className = "",
  withBadge = false,
}: StudioLogoProps) {
  const dimensions =
    size === "sm"
      ? { box: "h-7 w-7", icon: 16 }
      : size === "lg"
        ? { box: "h-10 w-10", icon: 22 }
        : { box: "h-8 w-8", icon: 18 };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className={`${dimensions.box} flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-linear-to-br from-[#FFF5EE] via-[#FDF8F3] to-[#F2D9DC] text-[var(--accent-text)] shadow-xs transition-transform duration-150 group-hover:scale-105 dark:from-[#262125] dark:via-[#1f1d22] dark:to-[#2b1f24] border-[rgba(242,217,220,0.2)]`}
        aria-hidden="true"
      >
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-xs"
        >
          {/* Subtle outer camera / aperture ring */}
          <rect
            x="2.5"
            y="3.5"
            width="19"
            height="17"
            rx="5.5"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-[var(--text-primary)] opacity-85"
          />
          {/* Studio reel notch lines */}
          <line
            x1="7"
            y1="3.5"
            x2="7"
            y2="7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="opacity-50"
          />
          <line
            x1="17"
            y1="3.5"
            x2="17"
            y2="7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="opacity-50"
          />
          {/* Friendly soft Play core */}
          <path
            d="M10 8.5L16 12L10 15.5V8.5Z"
            fill="currentColor"
            className="text-[var(--accent-text)]"
          />
          {/* Corner sparkle / star highlight */}
          <circle cx="18" cy="6.5" r="1.2" fill="#E11D48" className="opacity-90" />
        </svg>
      </div>

      {withBadge ? (
        <span className="font-mono-meta absolute -bottom-1 -right-1.5 rounded-full bg-[var(--accent-text)] px-1 py-0.2 text-[9px] font-bold tracking-wider text-white uppercase shadow-xs">
          Pro
        </span>
      ) : null}
    </div>
  );
}
