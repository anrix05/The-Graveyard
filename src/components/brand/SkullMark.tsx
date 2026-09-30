import React from 'react';

export interface SkullMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const SKULL_VIEWBOX = '0 0 24 24';

/**
 * Clean SVG paths for the skull mark matching the exact brand icon:
 * Cranium, jaw, nose, and eye sockets with uniform strokeWidth=2 and fill="none".
 */
export function SkullGraphic() {
  return (
    <g className="skull-graphic-group">
      {/* Nose cavity */}
      <path
        d="m12.5 17-.5-1-.5 1h1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main Cranium & Jaw Outline */}
      <path
        d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Eye Sockets */}
      <circle
        cx="9"
        cy="12"
        r="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="15"
        cy="12"
        r="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </g>
  );
}

export default function SkullMark({
  size = 24,
  className = '',
  ...props
}: SkullMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={SKULL_VIEWBOX}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <SkullGraphic />
    </svg>
  );
}
