"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { useCatalog } from "@/store/catalog";
import { defaultWorkSchedule, type WorkSchedule } from "@/store/venues";
import { useVenues } from "@/store/venues";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";
import WorkScheduleEditor from "@/features/venues/WorkScheduleEditor";
import TypesPicker from "@/features/venues/TypesPicker";
import { uploadImage } from "@/lib/uploadClient";

export default function VenueCreateForm({ cityId }: { cityId: string }) {
  const router = useRouter();
  const { getByCity, addVenue } = useVenues();
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
  const [schedule, setSchedule] = useState<WorkSchedule>(defaultWorkSchedule);

  const existingSlugs = useMemo(() => new Set(getByCity(cityId).map((v) => v.slug)), [cityId, getByCity]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const slugValid = useMemo(() => slug.trim().length >= 2 && !existingSlugs.has(slug.trim()), [slug, existingSlugs]);
  const canSave = useMemo(() => name.trim().length >= 2 && slugValid, [name, slugValid]);

  // function onPhotoFile(file: File | null) {
  //   if (!file) return;
  //   const reader = new FileReader();
  //   reader.onload = () => setPhotoUrl(typeof reader.result === "string" ? reader.result : "");
  //   reader.readAsDataURL(file);
  // }

  async function onPhotoFile(file: File | null) {
    if (!file) return;
    const url = await uploadImage(file, "venues");
    setPhotoUrl(url);
  }


  async function save() {
    if (!canSave) return;

    const created = await addVenue({
      cityId,
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

    router.push(`/admin/c/${cityId}/venues/${created.id}`);
  }

  return (
    <div className="ui-grid">
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>Додати заклад</h1>
          <div style={{ color: "var(--muted)" }}>
            Місто: <b>{cityId}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <SecondaryButton type="button" onClick={() => router.back()}>
            Назад
          </SecondaryButton>
          <Button type="button" disabled={!canSave} onClick={save}>
            Створити
          </Button>
        </div>
      </div>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Основне</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="ui-field">
            <div className="ui-label">Назва закладу</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Піцца Tomato" />
          </div>

          <div className="ui-field">
            <div className="ui-label">Slug закладу</div>
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

        <div className="ui-field">
          <div className="ui-label">Опис</div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Короткий опис..." />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "end" }}>
          <div className="ui-field">
            <div className="ui-label">Адреса</div>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Напр. вул. Васильківська 24" />
          </div>

          <div className="ui-field">
            <div className="ui-label">Час доставки (хв)</div>
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
            <div className="ui-field">
              <div className="ui-label">URL фото (опційно)</div>
              <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="ui-field">
              <div className="ui-label">Завантажити файл</div>
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
          Створити
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
  fontWeight: 950,
  letterSpacing: "-0.02em",
};
