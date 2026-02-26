"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { useCatalog } from "@/store/catalog";
import { type WorkSchedule, defaultWorkSchedule } from "@/store/venues";
import { useVenues } from "@/store/venues";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";
import WorkScheduleEditor from "@/features/venues/WorkScheduleEditor";
import TypesPicker from "@/features/venues/TypesPicker";
import { uploadImage } from "@/lib/uploadClient";

export default function VenueEditForm({ cityId, venueId }: { cityId: string; venueId: string }) {
  const router = useRouter();
  const { getById, getByCity, updateVenue } = useVenues();
  const { venueTypes, cuisineTypes, addVenueType, addCuisineType } = useCatalog();

  const venue = getById(venueId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMinutes, setDeliveryMinutes] = useState<number>(50);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [venueTypeIds, setVenueTypeIds] = useState<string[]>([]);
  const [cuisineTypeIds, setCuisineTypeIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<WorkSchedule>(defaultWorkSchedule);

  useEffect(() => {
    if (!venue || venue.cityId !== cityId) return;
    setName(venue.name);
    setDescription(venue.description);
    setAddress((venue as any).address ?? "");
    setDeliveryMinutes(Number((venue as any).deliveryMinutes ?? 50) || 50);
    setSlug(venue.slug);
    setPhotoUrl(venue.photoUrl || "");
    setVenueTypeIds(venue.venueTypeIds);
    setCuisineTypeIds(venue.cuisineTypeIds);
    setSchedule(venue.schedule ?? defaultWorkSchedule);
    setSlugTouched(false);
  }, [venueId]); // eslint-disable-line react-hooks/exhaustive-deps

  const existingSlugs = useMemo(() => {
    return new Set(
      getByCity(cityId)
        .filter((v) => v.id !== venueId)
        .map((v) => v.slug)
    );
  }, [cityId, venueId, getByCity]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const slugValid = useMemo(() => slug.trim().length >= 2 && !existingSlugs.has(slug.trim()), [slug, existingSlugs]);

  const canSave = useMemo(() => {
    return name.trim().length >= 2 && slugValid;
  }, [name, slugValid]);


  
  // function onPhotoFile(file: File | null) {
  //   if (!file) return;
  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     const val = typeof reader.result === "string" ? reader.result : "";
  //     console.log("photoUrl preview =", val);
  //     setPhotoUrl(val);
  //   };
  //   reader.readAsDataURL(file);
  // }

  async function onPhotoFile(file: File | null) {
    if (!file) return;
    const url = await uploadImage(file, "venues");
    setPhotoUrl(url);
  }

  function save() {
    if (!venue || venue.cityId !== cityId) return;
    if (!canSave) return;

    updateVenue(venueId, {
      name: name.trim(),
      description: description.trim(),
      address: address.trim(),
      deliveryMinutes,
      slug: slug.trim(),
      photoUrl: photoUrl || "",
      venueTypeIds,
      cuisineTypeIds,
      schedule,
    });

    router.push(`/admin/c/${cityId}/venues/${venueId}`);
  }

  if (!venue || venue.cityId !== cityId) {
    return (
      <div style={sectionStyle}>
        <div style={{ fontWeight: 900 }}>Заклад не знайдено</div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>Неможливо редагувати.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>Редагування закладу</h1>
          <div style={{ color: "var(--muted)" }}>
            Місто: <b>{cityId}</b> • ID: <b>{venueId}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <SecondaryButton type="button" onClick={() => router.back()}>
            Назад
          </SecondaryButton>
          <Button type="button" disabled={!canSave} onClick={save}>
            Зберегти
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
            <div style={{ color: slugValid ? "var(--muted)" : "#ef4444", fontSize: 12, fontWeight: 800 }}>
              {slugValid ? `URL: /${cityId}/${slug || "..."}` : "Slug зайнятий або некоректний"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={labelStyle}>Опис</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Короткий опис..." />
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

        <TypesPicker title="Типи закладу" items={venueTypes} selectedIds={venueTypeIds} onChange={setVenueTypeIds} onAdd={addVenueType} />

        <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />

        <TypesPicker title="Типи кухонь" items={cuisineTypes} selectedIds={cuisineTypeIds} onChange={setCuisineTypeIds} onAdd={addCuisineType} />
      </section>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Графік та години роботи</div>
        <WorkScheduleEditor value={schedule} onChange={setSchedule} />
      </section>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Медіа</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={labelStyle}>URL фото (опційно)</div>
              <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={labelStyle}>Завантажити файл</div>
              <input type="file" accept="image/*" onChange={(e) => onPhotoFile(e.target.files?.[0] ?? null)} style={{ color: "var(--muted)" }} />
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              background: "rgba(15, 23, 42, 0.03)",
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
          Зберегти
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
  fontWeight: 900,
};
