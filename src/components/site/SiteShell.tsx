"use client";

import React from "react";
import SiteMobileCartBar from "@/components/site/SiteMobileCartBar";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-public" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {children}
      <SiteMobileCartBar />
    </div>
  );
}
