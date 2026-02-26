"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/Page";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { uploadImage } from "@/lib/uploadClient";
import { useCatalog } from "@/store/catalog";
import { useSettings } from "@/store/settings";

type PhotosMap = Record<string, string>;

export default function CategoryPhotosPage() {
  const { venueTypes } = useCatalog();
  const { global, updateGlobal } = useSettings();

  const initial = useMemo<PhotosMap>(() => {
    const m = (global as any)?.siteCategoryPhotos;
    return m && typeof m === "object" ? { ...(m as any) } : {};
  }, [global]);

  const [photos, setPhotos] = useState<PhotosMap>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // keep in sync when settings load/refresh
  useEffect(() => {
    setPhotos(initial);
  }, [initial]);

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function onUpload(id: string, file: File) {
    setError("");
    try {
      const url = await uploadImage(file, "categories");
      setPhotos((p) => ({ ...p, [id]: url }));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Upload failed");
    }
  }

  async function onSave() {
    setSaving(true);
    setError("");
    try {
      updateGlobal({ siteCategoryPhotos: photos } as any);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <PageHeader title="Фото категорій (сайт)" description="Задайте картинки для сторінки “Категорії” (типи закладів). Можна вставити URL або завантажити файл." />

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Збереження..." : "Зберегти"}
        </Button>
        <SecondaryButton
          onClick={() => setPhotos(initial)}
          disabled={saving}
          title="Повернути до значень з налаштувань"
        >
          Скинути зміни
        </SecondaryButton>
        {error ? <Badge variant="stop">{error}</Badge> : null}
      </div>

      <Card>
        <CardHeader title="Категорії" subtitle="Картинки застосуються як background на картках категорій." />
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {venueTypes.map((t) => {
              const id = t.id;
              const url = photos[id] || photos[t.name] || "";
              return (
                <div
                  key={id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: 12,
                    padding: 12,
                    border: "1px solid rgba(31,41,55,0.08)",
                    borderRadius: 14,
                    alignItems: "center",
                    background: "rgba(255,255,255,0.6)",
                  }}
                >
                  <div
                    style={{
                      width: 120,
                      height: 72,
                      borderRadius: 14,
                      border: "1px solid rgba(31,41,55,0.10)",
                      background: url ? `url(${url})` : "linear-gradient(135deg,#e5e7eb,#9ca3af)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                    aria-label={`preview ${t.name}`}
                  />
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{t.name}</div>
                      <Badge variant="default">{id}</Badge>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                      <Input
                        value={url}
                        placeholder="https://... або /uploads/categories/..."
                        onChange={(e) => {
                          const v = e.target.value;
                          setPhotos((p) => ({ ...p, [id]: v }));
                        }}
                      />

                      <input
                        ref={(el) => {
                          fileInputs.current[id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUpload(id, file);
                          // reset so same file can be picked again
                          (e.target as HTMLInputElement).value = "";
                        }}
                      />

                      <SecondaryButton
                        onClick={() => fileInputs.current[id]?.click()}
                        title="Завантажити з комп'ютера/телефону"
                      >
                        Завантажити
                      </SecondaryButton>

                      <SecondaryButton
                        onClick={() => setPhotos((p) => {
                          const next = { ...p };
                          delete next[id];
                          return next;
                        })}
                        title="Очистити фото"
                      >
                        Очистити
                      </SecondaryButton>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Можна вставити пряме посилання або завантажити файл. Для fallback використовується автоматичний cover.
                    </div>
                  </div>
                </div>
              );
            })}
            {venueTypes.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.7 }}>Немає типів закладів. Додайте їх у “Категорії” (каталог).</div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
