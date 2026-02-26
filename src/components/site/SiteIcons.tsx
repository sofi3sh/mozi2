"use client";

import React from "react";

type Props = { size?: number; className?: string };

function base(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

export function PinIcon({ size = 18, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 22s7-4.5 7-12a7 7 0 1 0-14 0c0 7.5 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 18, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CartIcon({ size = 18, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6h15l-2 9H7L6 6Z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

export function ArrowUpIcon({ size = 18, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <span
      style={{
        width: size + 6,
        height: size + 6,
        borderRadius: 999,
        background: "#111827",
        display: "grid",
        placeItems: "center",
        position: "relative",
      }}
      aria-hidden
    >
      <span style={{ width: size - 2, height: size - 2, borderRadius: 999, background: "#f6f0e8" }} />
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: "#e6a24a",
          position: "absolute",
          top: 4,
          right: 4,
        }}
      />
    </span>
  );
}

export function StarIcon({ size = 18, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2l3.1 6.3 7 .99-5.05 4.92 1.2 6.96L12 17.9 5.75 21.2l1.2-6.96L1.9 9.29l7-.99L12 2Z" />
    </svg>
  );
}

export function ClockIcon({ size = 18, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 18, className }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function MenuIcon({ size = 18, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ size = 18, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
