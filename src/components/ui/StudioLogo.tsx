"use client";

import React from "react";

interface StudioLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  withBadge?: boolean;
}

/**
 * StudioLogo: Clean, friendly branded Content Studio logo icon adhering to the Friendly UI design system.
 * - In Light mode: Clean bright crisp white card surface with soft pastel amber/coral border & Manan wellness accent.
 * - In Dark mode: Deep surface with subtle translucent border and luminous accent.
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
        className={`${dimensions.box} flex items-center justify-center rounded-xl border border-[#F2D9DC] bg-white text-[#8A5A2B] shadow-xs transition-transform duration-150 group-hover:scale-105 dark:border-[rgba(242,217,220,0.25)] dark:bg-[#1E1F24] dark:text-[#F3C68F]`}
        aria-hidden="true"
      >
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Outer camera / studio canvas ring */}
          <rect
            x="2.5"
            y="3.5"
            width="19"
            height="17"
            rx="5"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-[#8A5A2B] opacity-80 dark:text-[#F3C68F]"
          />

          {/* Film / Studio reel notches */}
          <line
            x1="7.5"
            y1="3.5"
            x2="7.5"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="text-[#8A5A2B] opacity-40 dark:text-[#F3C68F]"
          />
          <line
            x1="16.5"
            y1="3.5"
            x2="16.5"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="text-[#8A5A2B] opacity-40 dark:text-[#F3C68F]"
          />

          {/* Friendly soft play triangle */}
          <path
            d="M10 8.5L16 12L10 15.5V8.5Z"
            fill="currentColor"
            className="text-[#8A5A2B] dark:text-[#F3C68F]"
          />

          {/* Vibrant coral accent dot */}
          <circle cx="18" cy="6.5" r="1.3" fill="#E11D48" />
        </svg>
      </div>

      {withBadge ? (
        <span className="font-mono-meta absolute -bottom-1 -right-1.5 rounded-full bg-[#8A5A2B] px-1 py-0.2 text-[9px] font-bold tracking-wider text-white uppercase shadow-xs">
          Pro
        </span>
      ) : null}
    </div>
  );
}
