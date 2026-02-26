"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { Card, CardHeader } from "@/components/ui/Card";
import { useCityScope } from "@/store/cityScope";
import { useSettings } from "@/store/settings";
import { useSiteT } from "@/i18n/useSiteT";
import styles from "./SiteCheckoutSuccess.module.css";

export default function SiteCheckoutSuccess() {
  const { t: siteT, lang } = useSiteT();
  const { global } = useSettings();
  const router = useRouter();
  const sp = useSearchParams();
  const { cities, lastCityId, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();

  const qsCity = sp.get("city") ?? "";
  // Якщо місто визначене піддоменом — пріоритетно беремо його
  const cityId = hostCityId || qsCity || lastCityId || "";
  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  const numbersRaw = sp.get("numbers") ?? "";
  const numbers = useMemo(
    () =>
      numbersRaw
        .split(",")
        .map((x) => parseInt(x.trim(), 10))
        .filter((n) => Number.isFinite(n)),
    [numbersRaw]
  );

  const cfg = (global as any)?.checkoutSuccess;
  const t = lang === "ru" ? cfg?.ru : cfg?.ua;
  const phones: string[] = Array.isArray(cfg?.phones) ? cfg.phones.map((x: any) => String(x || "").trim()).filter(Boolean) : [];

  function onSelectCity(id: string) {
    if (!id) return;
    setCurrentCityId(id);
    // В режимі піддоменів setCurrentCityId зробить редірект.
    if (subdomainsEnabled && rootDomain && typeof window !== "undefined") return;
    router.push(`/${lang}/checkout/success?city=${encodeURIComponent(id)}&numbers=${encodeURIComponent(numbersRaw)}`);
  }

  return (
    <>
      <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />

      <main className={styles.main}>
        <div className={styles.wrap}>
          <div className={`${styles.hero} ${styles.fade1}`}>
            <div aria-hidden className={styles.check}>
              ✓
            </div>

            <div className={styles.title}>{t?.title ?? siteT("order_success_title")}</div>

            <div className={styles.subtitle}>{t?.subtitle ?? (lang === "ru" ? "Спасибо за заказ!" : "Дякуємо за замовлення!")}</div>

            <div className={styles.message}>
              {t?.message ??
                (lang === "ru"
                  ? "Наш менеджер свяжется с вами в ближайшее время, чтобы подтвердить детали."
                  : "Наш менеджер зв’яжеться з вами найближчим часом, щоб підтвердити деталі.")}
            </div>
          </div>

          <Card className={`${styles.card} ${styles.fade2}`}>
            <div className={styles.cardInner}>
              <CardHeader
                title={lang === "ru" ? "Номер заказа" : "Номер замовлення"}
                subtitle={
                  city
                    ? lang === "ru"
                      ? `Город: ${city.name}`
                      : `Місто: ${city.name}`
                    : undefined
                }
              />

              <div style={{ paddingTop: 8 }}>
                {numbers.length ? (
                  <div className={styles.numbersRow}>
                    {numbers.map((n) => (
                      <div key={n} className={styles.pill}>
                        #{n}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", opacity: 0.75, fontWeight: 850, padding: "10px 0 4px" }}>
                    {lang === "ru"
                      ? "Номер заказа не передан (демо-режим)."
                      : "Номер замовлення не передано (демо-режим)."}
                  </div>
                )}

                {phones.length ? (
                  <div className={styles.phones}>
                    <div className={styles.phonesTitle}>
                      {t?.contactsTitle ?? (lang === "ru" ? "Есть вопросы?" : "Є додаткові питання?")}
                    </div>
                    <div className={styles.phonesHint}>
                      {t?.contactsHint ?? (lang === "ru" ? "Позвоните нам по номеру:" : "Зателефонуйте нам за номером:")}
                    </div>
                    <div className={styles.phonesRow}>
                      {phones.map((p) => (
                        <a
                          key={p}
                          href={`tel:${p.replace(/\s+/g, "")}`}
                          className={styles.phonePill}
                        >
                          {p}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <div className={`${styles.actions} ${styles.fade3}`}>
            <Link
              href={cityId ? `/${lang}/venues?city=${encodeURIComponent(cityId)}` : `/${lang}/venues`}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {siteT("order_more")}
            </Link>

            <Link
              href={cityId ? `/${lang}/categories?city=${encodeURIComponent(cityId)}` : `/${lang}/categories`}
              className={`${styles.btn} ${styles.btnGhost}`}
            >
              {siteT("back_to_main")}
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
