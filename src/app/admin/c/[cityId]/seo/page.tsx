"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/ui/Page";
import { Card, CardHeader } from "@/components/ui/Card";
import { SecondaryButton } from "@/components/ui/Input";
import { useVenues } from "@/store/venues";
import { useSeo } from "@/store/seo";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString("uk-UA");
  } catch {
    return "";
  }
}

export default function SeoPage({ params }: any) {
  const cityId = params?.cityId as string;

  const { getByCity } = useVenues();
  const { entries } = useSeo();

  const venues = useMemo(() => getByCity(cityId), [getByCity, cityId]);
  const cityEntries = useMemo(() => entries.filter((e) => e.cityId === cityId), [entries, cityId]);

  const links = useMemo(
    () => [
      { label: "Головна (SEO режим)", href: `/ua?seo=1#city-${encodeURIComponent(cityId)}` },
      { label: "Категорії (SEO режим)", href: `/ua/categories?seo=1#city-${encodeURIComponent(cityId)}` },
      { label: "Заклади (SEO режим)", href: `/ua/venues?seo=1#city-${encodeURIComponent(cityId)}` },
      { label: "Про нас (SEO режим)", href: `/ua/about?seo=1#city-${encodeURIComponent(cityId)}` },
      { label: "Контакти (SEO режим)", href: `/ua/contacts?seo=1#city-${encodeURIComponent(cityId)}` },
      { label: "Угода (SEO режим)", href: `/ua/terms?seo=1#city-${encodeURIComponent(cityId)}` },
    ],
    [cityId]
  );

  return (
    <div className="ui-grid">
      <PageHeader
        title={`SEO — ${cityId}`}
        description="Відкривайте сторінки сайту у SEO-режимі ( ?seo=1 ) і редагуйте SEO + текст внизу сторінки через кнопку SEO справа внизу. Після першого відкриття SEO-режим збережеться в цій вкладці, і ви зможете переходити між сторінками без повторного переходу з адмінки."
      />

      <div className="ui-twoCol">
        <Card>
          <CardHeader title="Посилання на сайт (SEO режим)" subtitle="Ці посилання відкривають сайт із параметром ?seo=1. Для клієнтів SEO-кнопка не відображається." />
          <div className="ui-grid">
            {links.map((l) => (
              <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
                <SecondaryButton type="button" style={{ width: "100%", justifyContent: "space-between" }}>
                  <span>{l.label}</span>
                  <span style={{ opacity: 0.6 }}>↗</span>
                </SecondaryButton>
              </Link>
            ))}

            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              Меню закладів (SEO режим):
            </div>

            <div className="ui-grid" style={{ gridTemplateColumns: "1fr", gap: 10 }}>
              {venues.map((v) => (
                <Link key={v.id} href={`/city/${encodeURIComponent(cityId)}/${encodeURIComponent(v.slug)}?seo=1`} style={{ textDecoration: "none" }}>
                  <SecondaryButton type="button" style={{ width: "100%", justifyContent: "space-between" }}>
                    <span>{v.name}</span>
                    <span style={{ opacity: 0.6 }}>↗</span>
                  </SecondaryButton>
                </Link>
              ))}
              {!venues.length ? <div className="ui-subtitle">Немає закладів у цьому місті.</div> : null}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Збережені SEO-налаштування" subtitle="Локальне збереження (localStorage) для демо. Потім винесемо в БД/API." />
          <div className="ui-grid">
            {cityEntries.length ? (
              <div style={{ overflow: "auto" }}>
                <table className="ui-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Сторінка</th>
                      <th style={{ textAlign: "left" }}>Оновлено</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityEntries
                      .slice()
                      .sort((a, b) => b.updatedAt - a.updatedAt)
                      .map((e) => (
                        <tr key={`${e.cityId}_${e.pageKey}`}>
                          <td style={{ fontWeight: 900 }}>{e.pageKey}</td>
                          <td style={{ opacity: 0.72, fontWeight: 800 }}>{fmt(e.updatedAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ui-subtitle">Ще немає збережених SEO-налаштувань для цього міста.</div>
            )}

            <div className="ui-subtitle">
              Порада: відкрий сторінку через посилання зліва → натисни кнопку <b>SEO</b> справа внизу → заповни UA/RU → збережи.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
