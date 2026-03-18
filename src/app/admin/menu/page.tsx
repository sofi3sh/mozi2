"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCityScope } from "@/store/cityScope";
import { useSession } from "@/store/session";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, EmptyState } from "@/components/ui/Page";
import { Button, SecondaryButton } from "@/components/ui/Input";

export default function HomeMenuPage() {
  const router = useRouter();
  const { user } = useSession();
  const { cities, lastCityId } = useCityScope();

  const hasCities = cities.length > 0;

  return (
    <div className="ui-grid">
      <PageHeader
        title="Головна"
        description="Оберіть місто та переходьте до закладів, меню, замовлень або SEO. Все привʼязано до міста — не буде плутанини."
        actions={
          user.role !== "seo" ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/admin/cities">
                <Button type="button">Керувати містами</Button>
              </Link>
              <Link href="/admin/catalog">
                <SecondaryButton type="button">Каталог (типи)</SecondaryButton>
              </Link>
            </div>
          ) : (
            <Link href={lastCityId ? `/admin/c/${lastCityId}/seo` : "/admin/menu"}>
              <Button type="button">SEO</Button>
            </Link>
          )
        }
      />

      {!hasCities ? (
        <EmptyState
          title="Ще немає міст"
          description="Створіть перше місто — після цього зможете додавати заклади і страви."
          actions={
            <Link href="/admin/cities">
              <Button type="button">Створити місто</Button>
            </Link>
          }
        />
      ) : (
        <div className="ui-grid">
          <Card>
            <CardHeader
              title="Міста"
              subtitle="Клікніть місто — відкриється дашборд. Або одразу відкрийте меню/заклади."
            />
            <div className="ui-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {cities.map((c) => (
                <div key={c.id} className="ui-row" style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, fontSize: 16 }}>{c.name}</div>
                      <div className="ui-subtitle">ID: {c.id}</div>
                    </div>
                    <SecondaryButton type="button" onClick={() => router.push(`/admin/c/${c.id}`)}>
                      Відкрити →
                    </SecondaryButton>
                  </div>

                  <div className="ui-divider" style={{ margin: "12px 0" }} />

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={`/admin/c/${c.id}/venues`}>
                      <SecondaryButton type="button">Заклади</SecondaryButton>
                    </Link>
                    <Link href={`/admin/c/${c.id}/menu`}>
                      <SecondaryButton type="button">Меню</SecondaryButton>
                    </Link>
                    {user.role !== "seo" ? (
                      <Link href={`/admin/c/${c.id}/orders`}>
                        <SecondaryButton type="button">Замовлення</SecondaryButton>
                      </Link>
                    ) : null}
                    {user.role === "seo" || user.role === "owner" ? (
                      <Link href={`/admin/c/${c.id}/seo`}>
                        <SecondaryButton type="button">SEO</SecondaryButton>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {lastCityId ? (
            <EmptyState
              title="Швидкий старт"
              description={
                <>
                  Останнє місто: <b>{lastCityId}</b>. Перейдіть одразу до меню цього міста.
                </>
              }
              actions={
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href={`/admin/c/${lastCityId}/menu`}>
                    <Button type="button">Меню міста</Button>
                  </Link>
                  <Link href={`/admin/c/${lastCityId}/venues`}>
                    <SecondaryButton type="button">Заклади</SecondaryButton>
                  </Link>
                </div>
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
