"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, SecondaryButton, Select } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/apiClient";
import { useUsers } from "@/store/users";
import { useCityScope } from "@/store/cityScope";

type RoleDto = {
  key: string;
  title: string;
  isSystem: boolean;
  permissions: { nav: string[] };
};

function fmtDate(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString("uk-UA", { year: "2-digit", month: "2-digit", day: "2-digit" });
}

function systemRoleTitle(key: string) {
  if (key === "owner") return "Власник";
  if (key === "admin") return "Адмін";
  if (key === "seo") return "SEO";
  if (key === "guest") return "Гість";
  return key;
}

export default function UsersClient({ cityId }: { cityId: string }) {
  const { users, addUser, updateUser, removeUser } = useUsers();
  const { cities } = useCityScope();

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesError, setRolesError] = useState<string>("");

  // table search
  const [q, setQ] = useState("");

  // edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("admin");
  const [isActive, setIsActive] = useState(true);
  const [allCities, setAllCities] = useState(false);
  const [cityIds, setCityIds] = useState<string[]>([cityId]);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>("");

  const isEdit = Boolean(editingId);

  useEffect(() => {
    // Load roles for dropdowns.
    api<{ roles: RoleDto[] }>("/api/roles")
      .then((data) => setRoles(Array.isArray(data.roles) ? data.roles : []))
      .catch((e: any) => {
        const msg = e instanceof ApiError ? e.message : "Не вдалося завантажити ролі";
        setRolesError(msg);
      });
  }, []);

  const roleTitleByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roles) m.set(r.key, r.title);
    return m;
  }, [roles]);

  const roleOptions = useMemo(() => {
    if (roles.length) return roles.slice();
    // Fallback if /api/roles is unavailable.
    return [
      { key: "owner", title: "Власник", isSystem: true, permissions: { nav: [] } },
      { key: "admin", title: "Адмін", isSystem: true, permissions: { nav: [] } },
      { key: "seo", title: "SEO", isSystem: true, permissions: { nav: [] } },
      { key: "guest", title: "Гість", isSystem: true, permissions: { nav: [] } },
    ] as RoleDto[];
  }, [roles]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(s));
  }, [users, q]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setEmail("");
    setRole("admin");
    setIsActive(true);
    setAllCities(false);
    setCityIds([cityId]);
    setPassword("");
    setErr("");
  }

  function startEdit(u: any) {
    setEditingId(u.id);
    setName(String(u.name ?? ""));
    setEmail(String(u.email ?? ""));
    setRole(String(u.role ?? "admin"));
    setIsActive(Boolean(u.isActive));
    const ids = Array.isArray(u.cityIds) ? u.cityIds : [];
    setAllCities(ids.length === 0);
    setCityIds(ids.length ? ids.slice() : [cityId]);
    setPassword("");
    setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCity(id: string) {
    setCityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function validate() {
    const n = name.trim();
    const em = email.trim();
    if (n.length < 2) return "Імʼя занадто коротке";
    if (!em.includes("@")) return "Невірний email";
    if (!role.trim()) return "Оберіть роль";
    if (!allCities && cityIds.length === 0) return "Оберіть хоча б одне місто";
    if (!isEdit && password.trim().length < 4) return "Пароль занадто короткий";
    if (isEdit && password.trim().length > 0 && password.trim().length < 4) return "Новий пароль занадто короткий";
    return "";
  }

  function save() {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      role,
      cityIds: allCities ? [] : cityIds,
      isActive,
    };

    if (isEdit && editingId) {
      updateUser(editingId, { ...payload, ...(password.trim() ? { password: password.trim() } : {}) });
      setPassword("");
      setErr("");
      return;
    }

    const created = addUser({ ...payload, password: password.trim() });
    if (!created) {
      setErr("Не вдалося створити користувача (перевірте email та пароль)");
      return;
    }
    resetForm();
  }

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title={isEdit ? "Редагування користувача" : "Додати користувача"}
          subtitle={
            isEdit
              ? "Можна змінювати логін (email), роль, доступ до міст та пароль."
              : "Власник створює користувача та задає логін/пароль, роль та міста."
          }
          right={
            isEdit ? (
              <SecondaryButton type="button" onClick={resetForm}>
                Скасувати
              </SecondaryButton>
            ) : null
          }
        />

        <div className="ui-grid" style={{ padding: 14 }}>
          {err ? (
            <div className="ui-card ui-card--soft" style={{ padding: 12, borderColor: "rgba(239,68,68,0.35)" }}>
              <b style={{ color: "rgba(239,68,68,1)" }}>{err}</b>
            </div>
          ) : null}

          {rolesError ? (
            <div className="ui-subtitle" style={{ color: "rgba(239,68,68,0.95)", fontWeight: 800 }}>
              {rolesError}
            </div>
          ) : null}

          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Імʼя</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Марія" />
            </div>
            <div className="ui-field">
              <div className="ui-label">Email (логін)</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@example.com" />
            </div>
          </div>

          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Роль</div>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                {roleOptions.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.title}
                  </option>
                ))}
              </Select>
              <div className="ui-subtitle" style={{ marginTop: 6 }}>
                Роль визначає доступ до розділів адмінки (permissions).
              </div>
            </div>

            <div className="ui-field">
              <div className="ui-label">Статус</div>
              <Select value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
                <option value="1">Активний</option>
                <option value="0">Вимкнений</option>
              </Select>
            </div>
          </div>

          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Пароль</div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Залиште порожнім, якщо не змінювати" : "Придумайте пароль"}
              />
              <div className="ui-subtitle" style={{ marginTop: 6 }}>
                {isEdit ? "Якщо введете — пароль буде змінено." : "Пароль зберігається у вигляді хеша."}
              </div>
            </div>

            <div className="ui-field">
              <div className="ui-label">Доступ до міст</div>
              <label className="ui-checkRow" style={{ marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={allCities}
                  onChange={(e) => setAllCities(e.target.checked)}
                />
                Всі міста
              </label>
              {!allCities ? (
                <div className="ui-card ui-card--soft" style={{ padding: 12, marginTop: 10 }}>
                  <div className="ui-subtitle" style={{ marginBottom: 10 }}>
                    Оберіть міста, за які відповідає користувач:
                  </div>
                  <div className="ui-grid" style={{ gap: 8 }}>
                    {cities.map((c) => (
                      <label key={c.id} className="ui-checkRow">
                        <input
                          type="checkbox"
                          checked={cityIds.includes(c.id)}
                          onChange={() => toggleCity(c.id)}
                        />
                        {c.name} <span className="ui-subtitle">({c.id})</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ui-subtitle" style={{ marginTop: 10 }}>
                  Користувач матиме доступ до всіх міст.
                </div>
              )}
            </div>
          </div>

          <div className="ui-actions">
            <Button type="button" onClick={save}>
              {isEdit ? "Зберегти зміни" : "Створити користувача"}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Список користувачів"
          subtitle="Редагуйте роль, доступ до міст і пароль."
          right={
            <div style={{ minWidth: 320 }}>
              <div className="ui-field">
                <div className="ui-label">Пошук</div>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Імʼя або email..." />
              </div>
            </div>
          }
        />

        <DataTable
          rows={filtered}
          getRowId={(u) => u.id}
          initialSortKey="createdAt"
          initialSortDir="desc"
          columns={[
            {
              key: "name",
              header: "Користувач",
              sortable: true,
              sortValue: (u) => u.name,
              cell: (u) => (
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontWeight: 950 }}>{u.name}</div>
                  <div className="ui-subtitle">{u.email}</div>
                </div>
              ),
            },
            {
              key: "role",
              header: "Роль",
              width: 220,
              sortable: true,
              sortValue: (u) => roleTitleByKey.get(u.role) || systemRoleTitle(u.role),
              cell: (u) => (
                <Select
                  value={u.role}
                  onChange={(e) => updateUser(u.id, { role: e.target.value })}
                  title="Роль"
                >
                  {roleOptions.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.title}
                    </option>
                  ))}
                </Select>
              ),
            },
            {
              key: "scope",
              header: "Міста",
              width: 260,
              sortable: true,
              sortValue: (u) => (u.cityIds.length ? u.cityIds.join(",") : "all"),
              cell: (u) => (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {u.cityIds.length === 0 ? (
                    <Badge>Всі міста</Badge>
                  ) : (
                    u.cityIds.map((id) => <Badge key={id}>{id}</Badge>)
                  )}
                </div>
              ),
            },
            {
              key: "status",
              header: "Статус",
              width: 190,
              sortable: true,
              sortValue: (u) => (u.isActive ? 1 : 0),
              cell: (u) => (
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {u.isActive ? <Badge variant="ok">Активний</Badge> : <Badge variant="stop">Вимкнений</Badge>}
                  <SecondaryButton type="button" onClick={() => updateUser(u.id, { isActive: !u.isActive })}>
                    {u.isActive ? "Вимкнути" : "Увімкнути"}
                  </SecondaryButton>
                </div>
              ),
            },
            {
              key: "createdAt",
              header: "Створено",
              width: 130,
              sortable: true,
              sortValue: (u) => new Date(u.createdAt),
              cell: (u) => <span className="ui-subtitle" style={{ fontWeight: 900 }}>{fmtDate(u.createdAt)}</span>,
            },
            {
              key: "actions",
              header: "",
              width: 220,
              cell: (u) => (
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <SecondaryButton type="button" onClick={() => startEdit(u)}>
                    Редагувати
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => removeUser(u.id)}
                    style={{ borderColor: "rgba(239,68,68,0.35)" }}
                  >
                    Видалити
                  </SecondaryButton>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
