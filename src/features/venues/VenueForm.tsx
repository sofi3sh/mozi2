"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { useCatalog } from "@/store/catalog";
import { defaultSchedule, type WorkSchedule } from "@/store/venues";
import { useVenues } from "@/store/venues";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";
import WorkScheduleEditor from "@/features/venues/WorkScheduleEditor";
import TypesPicker from "@/features/venues/TypesPicker";

export default function VenueForm({ cityId }: { cityId: string }) {
  const router = useRouter();
  const { addVenue, getByCity } = useVenues();
  const { venueTypes, cuisineTypes, addVenueType, addCuisineType } = useCatalog();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMinutes, setDeliveryMinutes] = useState<number>(50);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [venueTypeIds, setVenueTypeIds] = useState<string[]>([]);
  const [cuisineTypeIds, setCuisineTypeIds] = useState<string[]>([]);

  // ✅ schedule в стейті тепер WorkSchedule (як і в Venue)
  const [schedule, setSchedule] = useState<WorkSchedule>(() => {
    const ds: any = defaultSchedule as any;
    // якщо defaultSchedule вже WorkSchedule
    if (ds && typeof ds === "object" && "days" in ds && "exceptions" in ds) {
      return ds as WorkSchedule;
    }
    // якщо defaultSchedule це WorkDay[]
    return { days: ds ?? [], exceptions: [] } as WorkSchedule;
  });

  const existingSlugs = useMemo(() => new Set(getByCity(cityId).map((v) => v.slug)), [cityId, getByCity]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const slugValid = useMemo(() => slug.trim().length >= 2 && !existingSlugs.has(slug.trim()), [slug, existingSlugs]);

  const canSave = useMemo(() => {
    return name.trim().length >= 2 && slugValid;
  }, [name, slugValid]);

  function onPhotoFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  function save() {
    if (!canSave) return;

    addVenue({
      cityId,
      name: name.trim(),
      description: description.trim(),
      address: address.trim(),
      deliveryMinutes,
      slug: slug.trim(),
      photoUrl: photoUrl || "",
      venueTypeIds,
      cuisineTypeIds,
      // ✅ тепер вже правильний тип
      schedule,
    });

    router.push(`/admin/c/${cityId}/venues`);
  }

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 980 }}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>Новий заклад</h1>
          <div style={{ color: "var(--muted)" }}>
            Місто: <b>{cityId}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <SecondaryButton type="button" onClick={() => router.back()}>
            Назад
          </SecondaryButton>
          <Button type="button" disabled={!canSave} onClick={save}>
            Створити заклад
          </Button>
        </div>
      </div>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Основне</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Назва закладу</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Піцца Tomato" />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Slug закладу</label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="tomato-pizza"
            />
            <div style={{ color: slugValid ? "var(--muted)" : "#fca5a5", fontSize: 12 }}>
              {slugValid ? `URL: /${cityId}/${slug || "..."}` : "Slug зайнятий або некоректний"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={labelStyle}>Опис</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Короткий опис закладу..."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "end" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Адреса</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Напр. вул. Васильківська 24" />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Час доставки (хв)</label>
            <Input
              type="number"
              value={deliveryMinutes}
              onChange={(e) => setDeliveryMinutes(Number(e.target.value) || 0)}
              placeholder="50"
              min={0}
            />
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Типи закладу та кухонь</div>

        <TypesPicker
          title="Типи закладу"
          items={venueTypes}
          selectedIds={venueTypeIds}
          onChange={setVenueTypeIds}
          onAdd={addVenueType}
        />

        <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />

        <TypesPicker
          title="Типи кухонь"
          items={cuisineTypes}
          selectedIds={cuisineTypeIds}
          onChange={setCuisineTypeIds}
          onAdd={addCuisineType}
        />
      </section>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Графік та години роботи</div>
        {/* ✅ тепер типи збігаються */}
        <WorkScheduleEditor value={schedule} onChange={setSchedule} />
      </section>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Фото закладу</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={labelStyle}>URL фото (опційно)</div>
              <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Для демо можна вставити URL або завантажити файл нижче.
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={labelStyle}>Завантажити файл</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoFile(e.target.files?.[0] ?? null)}
                style={{ color: "var(--muted)" }}
              />
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              background: "rgba(18,33,58,0.25)",
              borderRadius: 12,
              minHeight: 180,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ color: "var(--muted)", padding: 14, textAlign: "center" }}>Превʼю фото</div>
            )}
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <SecondaryButton type="button" onClick={() => router.back()}>
          Скасувати
        </SecondaryButton>
        <Button type="button" disabled={!canSave} onClick={save}>
          Створити заклад
        </Button>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--panel)",
  borderRadius: 12,
  padding: 14,
  display: "grid",
  gap: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
};
