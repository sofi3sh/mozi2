"use client";

import React from "react";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "ok" | "stop";
}) {
  const cls =
    variant === "ok"
      ? "ui-badge ui-badge--ok"
      : variant === "stop"
      ? "ui-badge ui-badge--stop"
      : "ui-badge";
  return <span className={cls}>{children}</span>;
}
