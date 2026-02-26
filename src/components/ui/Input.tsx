"use client";

import React from "react";

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const baseField: React.CSSProperties = {
  background: "var(--panel-2)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "9px 11px",
  color: "var(--text)",
  outline: "none",
  width: "100%",
  boxShadow: "0 0 0 rgba(0,0,0,0)",
  transition: "box-shadow 120ms ease, border-color 120ms ease, transform 120ms ease, background 120ms ease",
};

function onFocusRing(el: HTMLElement) {
  (el.style as any).boxShadow = "0 0 0 4px rgba(var(--accent-rgb),0.18)";
  (el.style as any).borderColor = "rgba(var(--accent-rgb),0.55)";
}

function onBlurRing(el: HTMLElement) {
  (el.style as any).boxShadow = "none";
  (el.style as any).borderColor = "var(--border)";
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, style, ...rest } = props;
  return (
    <input
      {...rest}
      className={cx("ui-input", className)}
      style={{ ...baseField, ...(style ?? {}) }}
      onFocus={(e) => {
        onFocusRing(e.currentTarget);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        onBlurRing(e.currentTarget);
        props.onBlur?.(e);
      }}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, style, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cx("ui-textarea", className)}
      style={{ ...baseField, resize: "vertical", minHeight: 96, ...(style ?? {}) }}
      onFocus={(e) => {
        onFocusRing(e.currentTarget);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        onBlurRing(e.currentTarget);
        props.onBlur?.(e);
      }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, style, ...rest } = props;
  return (
    <select
      {...rest}
      className={cx("ui-select", className)}
      style={{
        ...baseField,
        appearance: "none",
        backgroundImage:
          "linear-gradient(45deg, transparent 50%, rgba(15,23,42,0.45) 50%), linear-gradient(135deg, rgba(15,23,42,0.45) 50%, transparent 50%)",
        backgroundPosition: "calc(100% - 18px) calc(50% - 2px), calc(100% - 12px) calc(50% - 2px)",
        backgroundSize: "6px 6px, 6px 6px",
        backgroundRepeat: "no-repeat",
        paddingRight: 34,
        ...(style ?? {}),
      }}
      onFocus={(e) => {
        onFocusRing(e.currentTarget);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        onBlurRing(e.currentTarget);
        props.onBlur?.(e);
      }}
    />
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, ...rest } = props;
  return (
    <button
      {...rest}
      style={{
        padding: "9px 12px",
        borderRadius: 12,
        border: "1px solid rgba(var(--accent-rgb),0.55)",
        background: "linear-gradient(180deg, rgba(var(--accent-rgb),1) 0%, rgba(var(--accent-rgb),0.86) 100%)",
        color: "#fff",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        letterSpacing: "-0.01em",
        boxShadow: "0 10px 22px rgba(var(--accent-rgb),0.18)",
        transition: "transform 120ms ease, filter 120ms ease, opacity 120ms ease",
        opacity: props.disabled ? 0.55 : 1,
        ...(style ?? {}),
      }}
      onMouseDown={(e) => {
        if (props.disabled) return;
        (e.currentTarget.style as any).transform = "translateY(1px)";
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        (e.currentTarget.style as any).transform = "translateY(0)";
        props.onMouseUp?.(e);
      }}
      onMouseEnter={(e) => {
        if (props.disabled) return;
        (e.currentTarget.style as any).filter = "brightness(1.02)";
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget.style as any).filter = "none";
        props.onMouseLeave?.(e);
      }}
    />
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, ...rest } = props;
  return (
    <button
      {...rest}
      style={{
        padding: "9px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        color: "var(--text)",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        letterSpacing: "-0.01em",
        transition: "transform 120ms ease, background 120ms ease, opacity 120ms ease",
        opacity: props.disabled ? 0.55 : 1,
        ...(style ?? {}),
      }}
      onMouseDown={(e) => {
        if (props.disabled) return;
        (e.currentTarget.style as any).transform = "translateY(1px)";
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        (e.currentTarget.style as any).transform = "translateY(0)";
        props.onMouseUp?.(e);
      }}
      onMouseEnter={(e) => {
        if (props.disabled) return;
        (e.currentTarget.style as any).background = "rgba(var(--accent-rgb),0.06)";
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget.style as any).background = "var(--panel)";
        props.onMouseLeave?.(e);
      }}
    />
  );
}
