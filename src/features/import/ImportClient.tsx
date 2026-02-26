"use client";

import React, { useMemo, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { Button, SecondaryButton } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useVenues } from "@/store/venues";
import { ModifierGroup, ModifierOption, useMenu } from "@/store/menu";

type DishSheetRow = {
  venueSlug: string;
  category: string;
  dishCode?: string;
  name: string;
  description?: string;
  basePrice?: number;
  photoUrl?: string;
  isStopped?: boolean;
  ingredientGroups?: string; // pipe-separated group titles
};

type VariationSheetRow = {
  venueSlug: string;
  dishCode: string;
  groupName?: string; // e.g. "Розмір"
  optionName: string; // e.g. "30 см / 410 г"
  grams?: number;
  price: number; // FULL price
  isStopped?: boolean;
};

type IngredientSheetRow = {
  venueSlug: string;
  groupTitle: string; // e.g. "Додатковий сир"
  optionName: string;
  grams?: number;
  price: number; // extra price
  maxQty?: number;
  isStopped?: boolean;
  minSelect?: number;
  maxSelect?: number;
};

type ParsedWorkbook = {
  dishes: DishSheetRow[];
  variations: VariationSheetRow[];
  ingredients: IngredientSheetRow[];
  rawPreview: Record<string, any>[]; // for table preview
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[’'`\"]/g, "")
    .replace(/[^a-z0-9а-яіїєґ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toBool(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "stop" || s === "stopped";
}

function toNumber(v: any) {
  const s = String(v ?? "").trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function splitPipes(v: any) {
  return String(v ?? "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
}

function findSheetName(sheetNames: string[], preferred: string[]) {
  const lower = new Map(sheetNames.map((n) => [n.toLowerCase(), n]));
  for (const p of preferred) {
    const got = lower.get(p.toLowerCase());
    if (got) return got;
  }
  // fallback: first sheet
  return sheetNames[0] ?? "";
}

async function parseXlsx(file: File): Promise<ParsedWorkbook> {
  // Lazy-load to keep initial admin bundle small.
  const XLSX = await import("xlsx");
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });

  const dishesSheet = findSheetName(wb.SheetNames, ["Dishes", "Страви", "Меню", "Menu"]);
  const varsSheet = findSheetName(wb.SheetNames, ["Variations", "Варіації", "Вариации"]);
  const ingSheet = findSheetName(wb.SheetNames, ["Ingredients", "Інгредієнти", "Ингредиенты"]);

  const dishesRaw = dishesSheet ? (XLSX.utils.sheet_to_json(wb.Sheets[dishesSheet], { defval: "" }) as any[]) : [];
  const varsRaw = varsSheet ? (XLSX.utils.sheet_to_json(wb.Sheets[varsSheet], { defval: "" }) as any[]) : [];
  const ingRaw = ingSheet ? (XLSX.utils.sheet_to_json(wb.Sheets[ingSheet], { defval: "" }) as any[]) : [];

  const dishes: DishSheetRow[] = dishesRaw
    .map((r) => {
      const venueSlug = String(r.venueSlug ?? r.venue ?? r.slug ?? "").trim();
      const category = String(r.category ?? r.categoryName ?? "").trim();
      const name = String(r.name ?? r.dish ?? "").trim();
      const dishCode = String(r.dishCode ?? r.code ?? "").trim();
      const description = String(r.description ?? "").trim();
      const basePrice = toNumber(r.basePrice ?? r.price ?? 0);
      const photoUrl = String(r.photoUrl ?? r.photo ?? "").trim();
      const isStopped = toBool(r.isStopped ?? r.stopped ?? false);
      const ingredientGroups = String(r.ingredientGroups ?? r.ingredients ?? "").trim();
      return { venueSlug, category, dishCode, name, description, basePrice, photoUrl, isStopped, ingredientGroups };
    })
    .filter((r) => r.venueSlug && r.category && r.name);

  const variations: VariationSheetRow[] = varsRaw
    .map((r) => {
      const venueSlug = String(r.venueSlug ?? r.venue ?? r.slug ?? "").trim();
      const dishCode = String(r.dishCode ?? r.code ?? r.dish ?? "").trim();
      const groupName = String(r.groupName ?? r.group ?? r.title ?? "Розмір").trim();
      const optionName = String(r.optionName ?? r.option ?? r.name ?? "").trim();
      const grams = toNumber(r.grams ?? r.weight ?? "");
      const price = toNumber(r.price ?? r.fullPrice ?? r.cost ?? 0);
      const isStopped = toBool(r.isStopped ?? r.stopped ?? false);
      return { venueSlug, dishCode, groupName, optionName, grams: grams || undefined, price, isStopped };
    })
    .filter((r) => r.venueSlug && r.dishCode && r.optionName);

  const ingredients: IngredientSheetRow[] = ingRaw
    .map((r) => {
      const venueSlug = String(r.venueSlug ?? r.venue ?? r.slug ?? "").trim();
      const groupTitle = String(r.groupTitle ?? r.group ?? r.title ?? "").trim();
      const optionName = String(r.optionName ?? r.option ?? r.name ?? "").trim();
      const grams = toNumber(r.grams ?? r.weight ?? "");
      const price = toNumber(r.price ?? r.extraPrice ?? r.cost ?? 0);
      const maxQty = toNumber(r.maxQty ?? r.max ?? "");
      const isStopped = toBool(r.isStopped ?? r.stopped ?? false);
      const minSelect = toNumber(r.minSelect ?? r.min ?? "");
      const maxSelect = toNumber(r.maxSelect ?? r.maxSelectGroup ?? r.maxGroup ?? "");
      return {
        venueSlug,
        groupTitle,
        optionName,
        grams: grams || undefined,
        price,
        maxQty: maxQty || undefined,
        isStopped,
        minSelect: Number.isFinite(minSelect) && minSelect > 0 ? minSelect : undefined,
        maxSelect: Number.isFinite(maxSelect) && maxSelect > 0 ? maxSelect : undefined,
      };
    })
    .filter((r) => r.venueSlug && r.groupTitle && r.optionName);

  return {
    dishes,
    variations,
    ingredients,
    rawPreview: dishesRaw.slice(0, 50) as any[],
  };
}

async function downloadTemplateXlsx() {
  const XLSX = await import("xlsx");

  const dishes = [
    {
      venueSlug: "smak",
      category: "Піца",
      dishCode: "margherita",
      name: "Маргарита",
      description: "Класична піца з томатами та сиром",
      basePrice: 199,
      photoUrl: "",
      isStopped: false,
      ingredientGroups: "Додатковий сир|Соуси",
    },
  ];

  const variations = [
    {
      venueSlug: "smak",
      dishCode: "margherita",
      groupName: "Розмір",
      optionName: "30 см / 410 г",
      grams: 410,
      price: 193,
      isStopped: false,
    },
    {
      venueSlug: "smak",
      dishCode: "margherita",
      groupName: "Розмір",
      optionName: "50 см / 820 г",
      grams: 820,
      price: 335,
      isStopped: false,
    },
  ];

  const ingredients = [
    {
      venueSlug: "smak",
      groupTitle: "Додатковий сир",
      optionName: "Моцарела",
      grams: 30,
      price: 25,
      maxQty: 3,
      isStopped: false,
      minSelect: 0,
      maxSelect: 3,
    },
    {
      venueSlug: "smak",
      groupTitle: "Додатковий сир",
      optionName: "Пармезан",
      grams: 20,
      price: 20,
      maxQty: 2,
      isStopped: false,
      minSelect: 0,
      maxSelect: 3,
    },
    {
      venueSlug: "smak",
      groupTitle: "Соуси",
      optionName: "Часниковий",
      grams: 30,
      price: 15,
      maxQty: 1,
      isStopped: false,
      minSelect: 0,
      maxSelect: 2,
    },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dishes), "Dishes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(variations), "Variations");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingredients), "Ingredients");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dishes_import_template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function mergeOptions(existing: ModifierOption[], incoming: ModifierOption[]) {
  const byName = new Map(existing.map((o) => [o.name.trim().toLowerCase(), o]));
  const seen = new Set<string>();
  const merged: ModifierOption[] = [];

  for (const n of incoming) {
    const key = n.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const ex = byName.get(key);
    merged.push({
      id: ex?.id ?? n.id,
      name: n.name,
      priceDelta: Math.round(n.priceDelta ?? 0),
      grams: n.grams,
      maxQty: n.maxQty,
      isStopped: Boolean(n.isStopped ?? false),
    });
  }

  // Keep old ones not mentioned (do not delete).
  for (const o of existing) {
    const key = o.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    merged.push(o);
  }
  return merged;
}

export default function ImportClient({ cityId }: { cityId: string }) {
  const { venues } = useVenues();
  const { categories, dishes, modifierGroups, addCategory, addDish, updateDish, addGroup, updateGroup } = useMenu();

  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedWorkbook | null>(null);
  const [result, setResult] = useState<{ ok: number; updated: number; skipped: number; errors: string[] } | null>(null);

  const cityVenues = useMemo(() => venues.filter((v) => v.cityId === cityId), [venues, cityId]);
  const venuesBySlug = useMemo(() => new Map(cityVenues.map((v) => [v.slug, v])), [cityVenues]);

  async function onFile(file: File | null) {
    setResult(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const wb = await parseXlsx(file);
      setParsed(wb);
    } catch (e: any) {
      setParsed(null);
      setResult({ ok: 0, updated: 0, skipped: 0, errors: [e?.message ?? "Не вдалося прочитати Excel файл"] });
    }
  }

  async function ensureCategory(cityId0: string, venueId: string, name: string) {
    const existing = categories
      .filter((c) => c.cityId === cityId0 && c.venueId === venueId)
      .find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    return await addCategory({ cityId: cityId0, venueId, name, sort: 0 });
  }

  async function doImport() {
    setResult(null);
    const wb = parsed;
    if (!wb || !wb.dishes.length) {
      setResult({ ok: 0, updated: 0, skipped: 0, errors: ["Файл порожній або лист Dishes/Страви не знайдено."] });
      return;
    }

    const errors: string[] = [];
    let ok = 0;
    let updated = 0;
    let skipped = 0;

    // Index ingredients by venue + groupTitle
    const ingByVenueGroup = new Map<
      string,
      { minSelect: number; maxSelect: number; options: ModifierOption[] }
    >();
    for (const r of wb.ingredients) {
      const key = `${r.venueSlug}::${r.groupTitle.trim().toLowerCase()}`;
      const prev = ingByVenueGroup.get(key);
      const opt: ModifierOption = {
        id: `opt_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
        name: r.optionName,
        priceDelta: Math.round(r.price ?? 0),
        grams: r.grams,
        maxQty: r.maxQty,
        isStopped: Boolean(r.isStopped ?? false),
      };
      if (!prev) {
        ingByVenueGroup.set(key, {
          minSelect: Math.max(0, Math.round(r.minSelect ?? 0)),
          maxSelect: Math.max(1, Math.round(r.maxSelect ?? 5)),
          options: [opt],
        });
      } else {
        prev.options.push(opt);
        // Keep first non-zero constraints.
        if (r.minSelect != null) prev.minSelect = Math.max(prev.minSelect, Math.round(r.minSelect));
        if (r.maxSelect != null) prev.maxSelect = Math.max(prev.maxSelect, Math.round(r.maxSelect));
      }
    }

    // Index variations by venue + dishCode
    const varsByVenueDish = new Map<
      string,
      { groupName: string; options: ModifierOption[] }
    >();
    for (const r of wb.variations) {
      const dishCode = r.dishCode?.trim() || "";
      if (!dishCode) continue;
      const key = `${r.venueSlug}::${dishCode.trim().toLowerCase()}`;
      const prev = varsByVenueDish.get(key);
      const opt: ModifierOption = {
        id: `opt_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
        name: r.optionName,
        // FULL price
        priceDelta: Math.round(r.price ?? 0),
        grams: r.grams,
        isStopped: Boolean(r.isStopped ?? false),
      };
      if (!prev) {
        varsByVenueDish.set(key, {
          groupName: (r.groupName || "Розмір").trim(),
          options: [opt],
        });
      } else {
        prev.options.push(opt);
      }
    }

    // Cache categories and dishes by venue
    const catsByVenue = new Map<string, any[]>();
    for (const c of categories) {
      if (c.cityId !== cityId) continue;
      const arr = catsByVenue.get(c.venueId) ?? [];
      arr.push(c);
      catsByVenue.set(c.venueId, arr);
    }

    const dishByVenueName = new Map<string, any>();
    for (const d of dishes) {
      if (d.cityId !== cityId) continue;
      dishByVenueName.set(`${d.venueId}::${d.name.trim().toLowerCase()}`, d);
    }

    // Cache modifier groups (local map to avoid duplicates during one import)
    const groupsByVenueTitle = new Map<string, ModifierGroup>();
    for (const g of modifierGroups) {
      if (g.cityId !== cityId) continue;
      groupsByVenueTitle.set(`${g.venueId}::${g.title.trim().toLowerCase()}`, g);
    }

    async function ensureGroupLocal(
      venueId: string,
      title: string,
      base: Pick<ModifierGroup, "required" | "minSelect" | "maxSelect">,
      incomingOptions: ModifierOption[]
    ) {
      const key = `${venueId}::${title.trim().toLowerCase()}`;
      const existing = groupsByVenueTitle.get(key);
      if (!existing) {
        const created = await addGroup({
          cityId,
          venueId,
          title,
          required: base.required,
          minSelect: base.minSelect,
          maxSelect: base.maxSelect,
          options: incomingOptions,
        });
        if (created) groupsByVenueTitle.set(key, created);
        return created;
      }

      const merged = mergeOptions(existing.options ?? [], incomingOptions);
      await updateGroup(existing.id, {
        required: base.required,
        minSelect: base.minSelect,
        maxSelect: base.maxSelect,
        options: merged,
      });
      const updatedGroup = { ...existing, ...base, options: merged } as ModifierGroup;
      groupsByVenueTitle.set(key, updatedGroup);
      return updatedGroup;
    }

    for (let idx = 0; idx < wb.dishes.length; idx++) {
      const r = wb.dishes[idx];
      const rowNo = idx + 2;

      const venueSlug = (r.venueSlug || "").trim();
      const categoryName = (r.category || "").trim();
      const name = (r.name || "").trim();
      const dishCode = (r.dishCode || slugify(name)).trim();
      const description = String(r.description ?? "").trim();
      const basePrice = Math.max(0, Math.round(r.basePrice ?? 0));
      const photoUrl = String(r.photoUrl ?? "").trim();
      const isStopped = Boolean(r.isStopped ?? false);

      if (!venueSlug || !categoryName || !name) {
        skipped++;
        errors.push(`Рядок ${rowNo} (Dishes): потрібні venueSlug, category, name.`);
        continue;
      }

      const venue = venuesBySlug.get(venueSlug);
      if (!venue) {
        skipped++;
        errors.push(`Рядок ${rowNo} (Dishes): заклад зі slug "${venueSlug}" не знайдено в місті.`);
        continue;
      }

      // category
      let existingCats = catsByVenue.get(venue.id) ?? [];
      let cat = existingCats.find((c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase());
      if (!cat) {
        const created = await ensureCategory(cityId, venue.id, categoryName);
        if (created) {
          cat = created;
          existingCats = [...existingCats, created];
          catsByVenue.set(venue.id, existingCats);
        }
      }
      if (!cat) {
        skipped++;
        errors.push(`Рядок ${rowNo} (Dishes): не вдалося створити категорію "${categoryName}".`);
        continue;
      }

      // ingredient groups to attach
      const ingTitles = splitPipes(r.ingredientGroups);
      const ingredientGroupIds: string[] = [];
      for (const t of ingTitles) {
        const key = `${venueSlug}::${t.trim().toLowerCase()}`;
        const data = ingByVenueGroup.get(key);
        if (!data) {
          // allow attaching an existing group even if not described in Ingredients sheet
          const existingGroup = modifierGroups
            .filter((g) => g.cityId === cityId && g.venueId === venue.id)
            .find((g) => g.title.trim().toLowerCase() === t.trim().toLowerCase());
          if (existingGroup) {
            ingredientGroupIds.push(existingGroup.id);
            continue;
          }
          errors.push(`Рядок ${rowNo} (Dishes): групу інгредієнтів "${t}" не знайдено (лист Ingredients).`);
          continue;
        }

        const group = await ensureGroupLocal(
          venue.id,
          t,
          { required: false, minSelect: data.minSelect ?? 0, maxSelect: data.maxSelect ?? 5 },
          data.options
        );
        if (group?.id) ingredientGroupIds.push(group.id);
      }

      // variation group to attach (per dishCode)
      const varKey = `${venueSlug}::${dishCode.trim().toLowerCase()}`;
      const varData = varsByVenueDish.get(varKey);
      let variationGroupId: string | null = null;
      if (varData?.options?.length) {
        const groupTitle = `VAR::${dishCode}::${varData.groupName}`;
        const group = await ensureGroupLocal(venue.id, groupTitle, { required: true, minSelect: 1, maxSelect: 1 }, varData.options);
        variationGroupId = group?.id ?? null;
      }

      // upsert dish by name within venue
      const dishKey = `${venue.id}::${name.trim().toLowerCase()}`;
      const existingDish = dishByVenueName.get(dishKey);
      const nextGroupIds = Array.from(
        new Set([
          ...(existingDish?.modifierGroupIds ?? []),
          ...ingredientGroupIds,
          ...(variationGroupId ? [variationGroupId] : []),
        ])
      );

      if (existingDish) {
        await updateDish(existingDish.id, {
          categoryId: cat.id,
          name,
          description,
          price: basePrice,
          photoUrl,
          isStopped,
          modifierGroupIds: nextGroupIds,
        });
        updated++;
      } else {
        const created = await addDish({
          cityId,
          venueId: venue.id,
          categoryId: cat.id,
          name,
          description,
          price: basePrice,
          photoUrl,
          isStopped,
          modifierGroupIds: nextGroupIds,
        });
        if (created?.id) dishByVenueName.set(dishKey, created);
        ok++;
      }
    }

    setResult({ ok, updated, skipped, errors });
  }

  const previewRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rawPreview.map((r, i) => ({ ...(r as any), __rowId: String(i) }));
  }, [parsed]);

  const columns = useMemo(() => {
    if (!previewRows.length) return [];
    const headers = Object.keys(previewRows[0]).filter((h) => h !== "__rowId");
    return headers.map((h) => ({
      key: h,
      header: h,
      sortable: true,
      sortValue: (row: any) => String(row[h] ?? ""),
      cell: (row: any) => <span style={{ fontWeight: 800 }}>{String(row[h] ?? "")}</span>,
    }));
  }, [previewRows]);

  return (
    <div className="ui-grid">
      <div style={{ display: "flex", gap: 12, alignItems: "end", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <SecondaryButton type="button" onClick={downloadTemplateXlsx} style={{ borderRadius: 999 }}>
              ⬇️ Завантажити шаблон Excel
            </SecondaryButton>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--panel)",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              📎 Обрати Excel файл
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                style={{ display: "none" }}
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Button type="button" onClick={doImport} disabled={!parsed?.dishes?.length}>
              Імпортувати страви
            </Button>

            <SecondaryButton
              type="button"
              onClick={() => {
                setParsed(null);
                setFileName("");
                setResult(null);
              }}
              style={{ borderRadius: 999 }}
            >
              Очистити
            </SecondaryButton>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge variant="default">{fileName ? fileName : "Файл не обрано"}</Badge>
          <Badge variant="ok">{parsed?.dishes?.length ?? 0} страв</Badge>
        </div>
      </div>

      {result ? (
        <div className="ui-row" style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Badge variant="ok">Додано: {result.ok}</Badge>
            <Badge variant="default">Оновлено: {result.updated}</Badge>
            <Badge variant="stop">Пропущено: {result.skipped}</Badge>
          </div>
          {result.errors.length ? (
            <div className="ui-subtitle" style={{ whiteSpace: "pre-wrap" }}>
              {result.errors.slice(0, 12).join("\n")}
              {result.errors.length > 12 ? `\n... та ще ${result.errors.length - 12}` : ""}
            </div>
          ) : (
            <div className="ui-subtitle">Без помилок ✅</div>
          )}
        </div>
      ) : null}

      {!parsed?.dishes?.length ? (
        <div className="ui-subtitle">
          1) Завантаж шаблон Excel → 2) Заповни листи Dishes / (опційно) Variations та Ingredients → 3) Завантаж файл → 4)
          Натисни “Імпортувати”.
        </div>
      ) : (
        <DataTable
          rows={previewRows as any}
          getRowId={(row) => (row as any).__rowId}
          columns={columns as any}
          empty={<div className="ui-subtitle">Немає рядків для превʼю.</div>}
        />
      )}

      <div className="ui-row ui-subtitle" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 950, color: "var(--text)" }}>Правила імпорту</div>
        <div>
          • <b>Імпорт тільки страв.</b> Заклади не створюються — поле <code>venueSlug</code> має відповідати існуючому закладу в
          цьому місті.
        </div>
        <div>
          • <b>Категорії</b> створюються автоматично, якщо їх немає.
        </div>
        <div>
          • <b>Варіації</b> (лист <code>Variations</code>) створюють групу для конкретної страви і додаються до неї автоматично.
          Ціна варіації = <b>повна</b> ціна.
        </div>
        <div>
          • <b>Інгредієнти</b> (лист <code>Ingredients</code>) створюють/оновлюють групи інгредієнтів. У листі <code>Dishes</code>
          вкажіть <code>ingredientGroups</code> через <code>|</code>, щоб прикріпити групи до страви.
        </div>
      </div>
    </div>
  );
}
