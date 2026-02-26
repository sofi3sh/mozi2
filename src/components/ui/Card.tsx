"use client";

import React from "react";

export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`ui-card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="ui-cardHeader">
      <div style={{ minWidth: 0 }}>
        <div className="ui-title">{title}</div>
        {subtitle ? (
          <div className="ui-subtitle" style={{ marginTop: 6 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}
