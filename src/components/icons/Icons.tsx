"use client";

import React from "react";

type Props = { size?: number; className?: string };

function svgBase(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

export function HomeIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5" />
    </svg>
  );
}

export function CityIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M4 21V8a2 2 0 0 1 2-2h4v15" />
      <path d="M10 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M8 10h.01M8 13h.01M8 16h.01" />
      <path d="M14 8h.01M14 11h.01M14 14h.01M14 17h.01" />
    </svg>
  );
}

export function DashboardIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M4 13h7V4H4v9Z" />
      <path d="M13 20h7V11h-7v9Z" />
      <path d="M13 4h7v5h-7z" />
      <path d="M4 20h7v-5H4z" />
    </svg>
  );
}

export function StoreIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M4 7h16l-1 5a2 2 0 0 1-2 1H7a2 2 0 0 1-2-1L4 7Z" />
      <path d="M6 13v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

export function MenuIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function OrdersIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M6 2h12v20H6z" />
      <path d="M9 6h6" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </svg>
  );
}

export function ClientsIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a3 3 0 0 0-2-2.82" />
      <path d="M18 7a3 3 0 0 1 0 6" />
    </svg>
  );
}

export function SeoIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-3.5-3.5" />
      <path d="M8 11h6" />
      <path d="M11 8v6" />
    </svg>
  );
}

export function AnalyticsIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M4 19V5" />
      <path d="M20 19V9" />
      <path d="M12 19V3" />
      <path d="M7 19h14" />
    </svg>
  );
}

export function UsersIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="3" />
      <path d="M20 8a3 3 0 1 1-6 0" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

export function SettingsIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.4-2.3.6a7.7 7.7 0 0 0-1.7-1l-.4-2.4H9l-.4 2.4a7.7 7.7 0 0 0-1.7 1l-2.3-.6-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 2L2.6 16.2l2 3.4 2.3-.6c.5.4 1.1.7 1.7 1l.4 2.4h6l.4-2.4c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.4-2.0-1.2Z" />
    </svg>
  );
}

export function ImportIcon({ size = 18, className }: Props) {
  return (
    <svg {...svgBase(size)} className={className}>
      <path d="M12 3v12" />
      <path d="M8 11l4 4 4-4" />
      <path d="M4 21h16" />
    </svg>
  );
}
