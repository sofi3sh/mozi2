"use client";

import React from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="ui-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950, fontSize: 20, letterSpacing: "-0.03em" }}>{title}</div>
          {description ? <div className="ui-subtitle" style={{ marginTop: 8 }}>{description}</div> : null}
        </div>
        {actions ? <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{actions}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="ui-card ui-card--soft" style={{ padding: 16 }}>
      <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
      {description ? <div className="ui-subtitle" style={{ marginTop: 8 }}>{description}</div> : null}
      {actions ? <div className="ui-actions" style={{ marginTop: 14 }}>{actions}</div> : null}
    </div>
  );
}
