"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, SecondaryButton } from "@/components/ui/Input";

type Props = {
  open: boolean;
  file: File | null;
  aspect: number; // width/height
  title?: string;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function ImageCropModal({ open, file, aspect, title, onCancel, onConfirm }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });

  const frame = useMemo(() => {
    const maxW = 520;
    const maxH = 360;
    let w = maxW;
    let h = Math.round(w / aspect);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * aspect);
    }
    return { w, h };
  }, [aspect]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ on: boolean; sx: number; sy: number; px: number; py: number }>({ on: false, sx: 0, sy: 0, px: 0, py: 0 });

  useEffect(() => {
    if (!open || !file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [open, file]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [url, frame.w, frame.h]);

  const baseScale = useMemo(() => {
    const s = Math.max(frame.w / imgSize.w, frame.h / imgSize.h);
    return s;
  }, [frame.w, frame.h, imgSize.w, imgSize.h]);

  const scale = baseScale * zoom;
  const dispW = imgSize.w * scale;
  const dispH = imgSize.h * scale;
  const maxPanX = Math.max(0, (dispW - frame.w) / 2);
  const maxPanY = Math.max(0, (dispH - frame.h) / 2);

  useEffect(() => {
    setPan((p) => ({ x: clamp(p.x, -maxPanX, maxPanX), y: clamp(p.y, -maxPanY, maxPanY) }));
  }, [maxPanX, maxPanY]);

  if (!open) return null;

  async function doCrop() {
    const img = imgRef.current;
    if (!img) return;

    const outW = aspect >= 1 ? 1600 : 1200;
    const outH = Math.round(outW / aspect);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // позиція картинки у фреймі
    const imgLeft = frame.w / 2 - dispW / 2 + pan.x;
    const imgTop = frame.h / 2 - dispH / 2 + pan.y;

    const srcX = (-imgLeft) / scale;
    const srcY = (-imgTop) / scale;
    const srcW = frame.w / scale;
    const srcH = frame.h / scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
    if (!blob) return;
    const cropped = new File([blob], (file?.name || "image") + ".jpg", { type: "image/jpeg" });
    onConfirm(cropped);
  }

  return (
    <div className="ui-modalBackdrop" role="dialog" aria-modal="true">
      <div className="ui-modal" style={{ width: Math.min(820, frame.w + 280) }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>{title || "Обрізка фото"}</div>
          <SecondaryButton type="button" onClick={onCancel}>
            Закрити
          </SecondaryButton>
        </div>

        <div className="ui-cropLayout">
          <div
            className="ui-cropWrap"
            style={{ width: frame.w, height: frame.h }}
            onPointerDown={(e) => {
              drag.current = { on: true, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current.on) return;
              const dx = e.clientX - drag.current.sx;
              const dy = e.clientY - drag.current.sy;
              setPan({
                x: clamp(drag.current.px + dx, -maxPanX, maxPanX),
                y: clamp(drag.current.py + dy, -maxPanY, maxPanY),
              });
            }}
            onPointerUp={() => {
              drag.current.on = false;
            }}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={url}
                alt="crop"
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setImgSize({ w: el.naturalWidth || 1, h: el.naturalHeight || 1 });
                }}
                style={{
                  width: dispW,
                  height: dispH,
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: -dispW / 2,
                  marginTop: -dispH / 2,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div className="ui-subtitle">Немає файлу</div>
            )}
            <div className="ui-cropGuide" />
          </div>

          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div className="ui-subtitle">Перетягуйте фото мишкою/пальцем та налаштуйте масштаб.</div>

            <div className="ui-field">
              <div className="ui-label">Масштаб</div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>

            <div className="ui-actions" style={{ justifyContent: "flex-start" }}>
              <SecondaryButton type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                Скинути
              </SecondaryButton>
              <Button type="button" onClick={doCrop}>
                Зберегти
              </Button>
            </div>

            <div className="ui-subtitle">Формат: JPG • аспект: {aspect.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
