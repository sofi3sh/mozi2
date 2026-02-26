"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/apiClient";
import { useSession } from "@/store/session";

type RoleDto = {
  key: string;
  title: string;
  isSystem: boolean;
  permissions: { nav: string[] };
  createdAt?: string;
  updatedAt?: string;
};

const NAV_SECTIONS: Array<{ key: string; label: string; group: "Загальні" | "Місто" }> = [
  { key: "home", label: "Головна", group: "Загальні" },
  { key: "cities", label: "Міста", group: "Загальні" },
  { key: "integrations", label: "Інтеграції", group: "Загальні" },
  { key: "pages", label: "Сторінки", group: "Загальні" },
  { key: "general_settings", label: "Загальні налаштування", group: "Загальні" },

  { key: "city_dashboard", label: "Дашборд міста", group: "Місто" },
  { key: "venues", label: "Заклади", group: "Місто" },
  { key: "menu", label: "Меню", group: "Місто" },
  { key: "orders", label: "Замовлення", group: "Місто" },
  { key: "clients", label: "Клієнти", group: "Місто" },
  { key: "seo", label: "SEO", group: "Місто" },
  { key: "analytics", label: "Аналітика", group: "Місто" },
  { key: "users", label: "Користувачі", group: "Місто" },
  { key: "import", label: "Імпорт (Excel)", group: "Місто" },
];

function normalizeKey(raw: string) {
  return raw.trim().toLowerCase();
}

function unique(arr: string[]) {
  return Array.from(new Set(arr));
}

export default function RolesClient() {
  const { user } = useSession();
  const isOwner = String(user.role) === "owner";

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<RoleDto | null>(null);

  // Form state
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [nav, setNav] = useState<string[]>([]);

  const isEdit = Boolean(selected);

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const data = await api<{ roles: RoleDto[] }>("/api/roles");
      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Не вдалося завантажити ролі";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return roles;
    return roles.filter((r) => `${r.key} ${r.title}`.toLowerCase().includes(s));
  }, [roles, q]);

  function startCreate() {
    setSelected(null);
    setKey("");
    setTitle("");
    setNav([]);
    setErr("");
  }

  function startEdit(r: RoleDto) {
    setSelected(r);
    setKey(r.key);
    setTitle(r.title);
    setNav(Array.isArray(r.permissions?.nav) ? r.permissions.nav.slice() : []);
    setErr("");
  }

  function toggleNav(k: string) {
    setNav((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  function setAll(group?: "Загальні" | "Місто") {
    const list = NAV_SECTIONS.filter((x) => (group ? x.group === group : true)).map((x) => x.key);
    setNav((prev) => unique([...prev, ...list]));
  }

  function clearAll(group?: "Загальні" | "Місто") {
    if (!group) return setNav([]);
    const groupKeys = new Set(NAV_SECTIONS.filter((x) => x.group === group).map((x) => x.key));
    setNav((prev) => prev.filter((x) => !groupKeys.has(x)));
  }

  async function save() {
    if (!isOwner) {
      setErr("Лише власник може керувати ролями");
      return;
    }

    const k = normalizeKey(key);
    const t = title.trim();
    if (k.length < 2) return setErr("Ключ ролі занадто короткий");
    if (t.length < 2) return setErr("Назва ролі занадто коротка");

    const payload = { key: k, title: t, permissions: { nav: unique(nav) } };

    setLoading(true);
    setErr("");
    try {
      if (isEdit) {
        const res = await api<{ role: RoleDto }>(`/api/roles/${encodeURIComponent(k)}`, {
          method: "PATCH",
          body: JSON.stringify({ title: t, permissions: { nav: unique(nav) } }),
        });
        setSelected(res.role);
      } else {
        const res = await api<{ role: RoleDto }>("/api/roles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSelected(res.role);
      }

      await refresh();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Не вдалося зберегти роль";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function removeRole() {
    if (!selected) return;
    if (!isOwner) {
      setErr("Лише власник може керувати ролями");
      return;
    }
    if (selected.isSystem) {
      setErr("Системні ролі не можна видаляти");
      return;
    }
    const ok = confirm(`Видалити роль “${selected.title}” (${selected.key})?`);
    if (!ok) return;

    setLoading(true);
    setErr("");
    try {
      await api(`/api/roles/${encodeURIComponent(selected.key)}`, { method: "DELETE" });
      startCreate();
      await refresh();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Не вдалося видалити роль";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  const general = NAV_SECTIONS.filter((x) => x.group === "Загальні");
  const city = NAV_SECTIONS.filter((x) => x.group === "Місто");

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title={isEdit ? "Редагувати роль" : "Створити роль"}
          subtitle={isEdit ? `Ключ: ${selected?.key}` : "Задайте назву та доступні розділи адмінки."}
          right={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <SecondaryButton type="button" onClick={startCreate}>
                Нова роль
              </SecondaryButton>
              {isEdit ? (
                <SecondaryButton
                  type="button"
                  onClick={removeRole}
                  style={{ borderColor: "rgba(239,68,68,0.35)" }}
                >
                  Видалити
                </SecondaryButton>
              ) : null}
            </div>
          }
        />

        {!isOwner ? (
          <div className="ui-subtitle" style={{ padding: 14 }}>
            Лише <b>власник</b> може створювати та редагувати ролі.
          </div>
        ) : null}

        <div className="ui-grid" style={{ padding: 14 }}>
          {err ? (
            <div className="ui-card ui-card--soft" style={{ padding: 12, borderColor: "rgba(239,68,68,0.35)" }}>
              <b style={{ color: "rgba(239,68,68,1)" }}>{err}</b>
            </div>
          ) : null}

          <div className="ui-field">
            <div className="ui-label">Ключ ролі</div>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Напр. content_manager"
              disabled={isEdit}
            />
            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              Лише латиниця/цифри, _ та -. Не змінюється після створення.
            </div>
          </div>

          <div className="ui-field">
            <div className="ui-label">Назва ролі</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Контент-менеджер" />
          </div>

          <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950 }}>Доступ до розділів</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <SecondaryButton type="button" onClick={() => setAll()}>
                  Увімкнути все
                </SecondaryButton>
                <SecondaryButton type="button" onClick={() => clearAll()}>
                  Очистити
                </SecondaryButton>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950 }}>Загальні</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <SecondaryButton type="button" onClick={() => setAll("Загальні")}>
                      Все
                    </SecondaryButton>
                    <SecondaryButton type="button" onClick={() => clearAll("Загальні")}>
                      Очистити
                    </SecondaryButton>
                  </div>
                </div>
                <div className="ui-grid" style={{ gap: 8, marginTop: 10 }}>
                  {general.map((s) => (
                    <label key={s.key} className="ui-checkRow">
                      <input type="checkbox" checked={nav.includes(s.key)} onChange={() => toggleNav(s.key)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950 }}>Місто</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <SecondaryButton type="button" onClick={() => setAll("Місто")}>
                      Все
                    </SecondaryButton>
                    <SecondaryButton type="button" onClick={() => clearAll("Місто")}>
                      Очистити
                    </SecondaryButton>
                  </div>
                </div>
                <div className="ui-grid" style={{ gap: 8, marginTop: 10 }}>
                  {city.map((s) => (
                    <label key={s.key} className="ui-checkRow">
                      <input type="checkbox" checked={nav.includes(s.key)} onChange={() => toggleNav(s.key)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="ui-actions">
            <Button type="button" onClick={save} disabled={!isOwner || loading}>
              {loading ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Список ролей"
          subtitle="Натисніть на роль, щоб відредагувати." 
          right={
            <div style={{ minWidth: 320 }}>
              <div className="ui-field">
                <div className="ui-label">Пошук</div>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ключ або назва..." />
              </div>
            </div>
          }
        />

        <div style={{ padding: 14, paddingTop: 0 }}>
          {loading && !roles.length ? <div className="ui-subtitle">Завантаження...</div> : null}
          <DataTable
            rows={filtered}
            getRowId={(r) => r.key}
            initialSortKey="isSystem"
            initialSortDir="desc"
            onRowClick={(r) => startEdit(r)}
            columns={[
              {
                key: "title",
                header: "Роль",
                sortable: true,
                sortValue: (r) => r.title,
                cell: (r) => (
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 950, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {r.title}
                      {r.isSystem ? <Badge>Системна</Badge> : <Badge variant="ok">Кастомна</Badge>}
                    </div>
                    <div className="ui-subtitle">{r.key}</div>
                  </div>
                ),
              },
              {
                key: "nav",
                header: "Розділів",
                width: 130,
                align: "right",
                sortable: true,
                sortValue: (r) => (Array.isArray(r.permissions?.nav) ? r.permissions.nav.length : 0),
                cell: (r) => (
                  <span className="ui-subtitle" style={{ fontWeight: 950 }}>
                    {Array.isArray(r.permissions?.nav) ? r.permissions.nav.length : 0}
                  </span>
                ),
              },
              {
                key: "hint",
                header: "",
                width: 180,
                align: "right",
                cell: (r) => (
                  <SecondaryButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(r);
                    }}
                  >
                    Редагувати
                  </SecondaryButton>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
