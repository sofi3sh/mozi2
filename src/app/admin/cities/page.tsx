"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useCityScope } from "@/store/cityScope";
import { useSession } from "@/store/session";
import ImageCropModal from "@/components/ui/ImageCropModal";
import { uploadImage } from "@/lib/uploadClient";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, EmptyState } from "@/components/ui/Page";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";

export default function CitiesPage() {
  const { user } = useSession();
  const { cities, addCity, renameCity, removeCity, setCityPhoto } = useCityScope();

  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const canCreate = useMemo(() => name.trim().length >= 2, [name]);

  const [cropCityId, setCropCityId] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const cityForCrop = useMemo(() => cities.find((c) => c.id === cropCityId) || null, [cities, cropCityId]);

  async function create() {
    const nm = name.trim();
    if (!nm) return;
    const created = await addCity(nm, { nameRu: nameRu.trim() });
    if (!created) return;
    setName("");
    setNameRu("");
  }

  async function onCropped(file: File) {
    if (!cityForCrop) return;
    setSavingPhoto(true);
    try {
      const url = await uploadImage(file, "cities");
      await setCityPhoto(cityForCrop.id, url);
    } finally {
      setSavingPhoto(false);
      setCropCityId(null);
      setCropFile(null);
    }
  }



  return (
    <div className="ui-grid">
      <PageHeader
        title="Міста"
        description="Owner/Admin створює міста. Кожне місто — окрема область даних (заклади/страви/замовлення)."
        actions={
          <Link href="/admin/menu">
            <SecondaryButton type="button">На головну</SecondaryButton>
          </Link>
        }
      />

      {user.role !== "owner" && user.role !== "admin" ? (
        <EmptyState
          title="Недостатньо прав"
          description="Цей розділ доступний тільки Owner/Admin."
          actions={
            <Link href="/admin/menu">
              <Button type="button">Повернутись</Button>
            </Link>
          }
        />
      ) : (
        <div className="ui-twoCol">
          <Card>
            <CardHeader
              title="Створити місто"
              subtitle="ID генерується автоматично (slug). Пізніше це стане піддоменом."
            />
            <div className="ui-grid">
              <div className="ui-field">
                <div className="ui-label">Назва міста</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Дніпро" />
              </div>
              <div className="ui-field">
                <div className="ui-label">Назва міста (RU)</div>
                <Input value={nameRu} onChange={(e) => setNameRu(e.target.value)} placeholder="Напр. Днепр" />
              </div>
              <div className="ui-actions">
                <Button type="button" disabled={!canCreate} onClick={create}>
                  Додати місто
                </Button>
              </div>
              <div className="ui-subtitle">Порада: назву можна змінити пізніше, ID залишиться стабільним.</div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Список міст" subtitle="Відкривайте дашборд міста або переходьте одразу в меню." />
            {!cities.length ? (
              <EmptyState title="Міст немає" description="Створіть перше місто зліва." />
            ) : (
              <div className="ui-grid">
                {cities.map((c) => (
                  <CityRow
                    key={c.id}
                    city={c}
                    onRename={(name, nameRu) => renameCity(c.id, name, { nameRu })}
                    onPhoto={(file) => {
                      setCropCityId(c.id);
                      setCropFile(file);
                    }}
                    onRemovePhoto={() => setCityPhoto(c.id, null)}
                    onRemove={() => removeCity(c.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <ImageCropModal
        open={!!cropFile && !!cityForCrop}
        file={cropFile}
        aspect={16 / 9}
        title={savingPhoto ? "Збереження…" : `Фото міста: ${cityForCrop?.name || ""}`}
        onCancel={() => {
          if (savingPhoto) return;
          setCropCityId(null);
          setCropFile(null);
        }}
        onConfirm={onCropped}
      />
    </div>
  );
}

function CityRow({
  city,
  onRename,
  onPhoto,
  onRemovePhoto,
  onRemove,
}: {
  city: { id: string; name: string; nameRu?: string | null; photoUrl?: string | null };
  onRename: (name: string, nameRu: string) => void;
  onPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(city.name);
  const [nameRu, setNameRu] = useState(city.nameRu ?? "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="ui-row">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, border: "1px solid var(--border)", background: "var(--panel-2)", overflow: "hidden", display: "grid", placeItems: "center" }}>
          {city.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={city.photoUrl} alt={city.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ fontWeight: 950, color: "var(--muted)", fontSize: 18 }}>{city.name.slice(0, 1).toUpperCase()}</div>
          )}
        </div>

        <div style={{ minWidth: 320, flex: "1 1 420px" }}>
          <div className="ui-label">Місто</div>
          {editing ? (
            <div className="ui-grid" style={{ gridTemplateColumns: "1fr", gap: 10 }}>
              <div className="ui-field" style={{ margin: 0 }}>
                <div className="ui-label">UA</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
              </div>
              <div className="ui-field" style={{ margin: 0 }}>
                <div className="ui-label">RU</div>
                <Input
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  placeholder="Напр. Славянск"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          ) : (
            <div style={{ fontWeight: 950 }}>
              {city.name}
              {city.nameRu ? <span style={{ marginLeft: 8, opacity: 0.7 }}>RU: {city.nameRu}</span> : null}
            </div>
          )}
          <div className="ui-subtitle" style={{ marginTop: 6 }}>ID: <b>{city.id}</b></div>
        </div>

        <div className="ui-actions" style={{ flex: "0 0 auto", marginLeft: "auto" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.currentTarget.value = "";
              if (f) onPhoto(f);
            }}
          />

          <SecondaryButton type="button" onClick={() => fileRef.current?.click()}>
            {city.photoUrl ? "Змінити фото" : "Додати фото"}
          </SecondaryButton>
          {city.photoUrl ? (
            <SecondaryButton
              type="button"
              onClick={onRemovePhoto}
              style={{ borderColor: "rgba(239,68,68,0.35)" }}
            >
              Прибрати фото
            </SecondaryButton>
          ) : null}

          <Link href={`/admin/c/${city.id}`}>
            <SecondaryButton type="button">Дашборд</SecondaryButton>
          </Link>
          <Link href={`/admin/c/${city.id}/menu`}>
            <Button type="button">Меню</Button>
          </Link>

          {editing ? (
            <>
              <SecondaryButton type="button" onClick={() => setEditing(false)}>Скасувати</SecondaryButton>
              <Button
                type="button"
                onClick={() => {
                  onRename(name, nameRu);
                  setEditing(false);
                }}
                disabled={name.trim().length < 2}
              >
                Зберегти
              </Button>
            </>
          ) : (
            <SecondaryButton type="button" onClick={() => setEditing(true)}>Редагувати</SecondaryButton>
          )}

          <SecondaryButton type="button" onClick={onRemove} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            Видалити
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
