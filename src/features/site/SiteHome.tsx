"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCityScope } from "@/store/cityScope";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";
import SeoBottomText from "@/components/site/seo/SeoBottomText";
import SeoFab from "@/components/site/seo/SeoFab";
import { ChevronDownIcon, PinIcon } from "@/components/site/SiteIcons";

export default function SiteHome() {
  const { lang } = useSiteLang();
  const { t } = useSiteT();
  const router = useRouter();
  const sp = useSearchParams();
  const { cities, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();

  const qsCity = sp.get("city") ?? "";

  const [selectedCityId, setSelectedCityId] = useState<string>("");

  useEffect(() => {
    // Якщо місто визначене піддоменом — показуємо його, але не "запамʼятовуємо" автоматично.
    if (hostCityId) {
      setSelectedCityId(hostCityId);
      return;
    }

    // Якщо місто задане в query-параметрі — показуємо (без автозбереження).
    if (qsCity) {
      setSelectedCityId(qsCity);
      return;
    }
  }, [qsCity, hostCityId]);

  function onSelectCity(id: string) {
    setSelectedCityId(id);
    if (id) setCurrentCityId(id);
  }

  function onSearch() {
    if (!selectedCityId) return;

    // Subdomains mode: navigate to the city's subdomain and open /categories (no ?city=)
    if (subdomainsEnabled && rootDomain && typeof window !== "undefined") {
      const m = rootDomain.match(/^([^:]+)(?::(\d+))?$/);
      const rootHost = (m?.[1] ?? rootDomain).toLowerCase();
      const rootPort = m?.[2] ?? "";

      const url = new URL(window.location.href);
      url.hostname = `${selectedCityId}.${rootHost}`;
      url.pathname = "/categories";
      url.search = "";
      if (rootPort) url.port = rootPort;
      url.searchParams.delete("city");
      window.location.assign(url.toString());
      return;
    }

    router.push(`/${lang}/categories?city=${encodeURIComponent(selectedCityId)}`);
  }

  const selectedCityName = useMemo(
    () => cities.find((c) => c.id === selectedCityId)?.name ?? t("choose_city"),
    [cities, selectedCityId, t]
  );

  const h1 = lang === "ru" ? "Вкусная еда" : "Смачна їжа";
  const h2 = lang === "ru" ? "к вашему дому" : "до вашого дому";
  const sub =
    lang === "ru"
      ? "Выбирайте любимые блюда из лучших заведений вашего города"
      : "Обирайте улюблені страви з найкращих закладів вашого міста";
  const searchLabel = lang === "ru" ? "Искать" : "Шукати";

  return (
    <div>
      <SeoFab
        lang={lang}
        cityId={selectedCityId || "global"}
        pageKey="home"
        hint={lang === "ru" ? "Главная" : "Головна"}
      />

      <SiteHeader cities={cities} selectedCityId={selectedCityId} onSelectCity={onSelectCity} />

      <main>
        <section className="homeHero">
          <div className="homeHeroInner">
            <div style={{ fontSize: "clamp(42px, 9vw, 74px)", fontWeight: 950, letterSpacing: "-0.04em", lineHeight: 1.02, color: "#111827" }}>
              {h1}
            </div>
            <div style={{ fontSize: "clamp(42px, 9vw, 74px)", fontWeight: 950, letterSpacing: "-0.04em", lineHeight: 1.02, color: "#e6a24a", marginTop: 6 }}>
              {h2}
            </div>

            <div style={{ marginTop: 16, fontSize: 16, opacity: 0.72, fontWeight: 700 }}>{sub}</div>

            
            <div className="homeSearchWrap">
              <div className="homeSearchCard">
                <div className="homeCityField">
                  <span className="homeCityIcon">
                    <PinIcon size={18} />
                  </span>

                  <div className="homeCitySelectWrap">
                    <select
                      className="homeCitySelect"
                      value={selectedCityId}
                      onChange={(e) => onSelectCity(e.target.value)}
                    >
                      <option value="">{t("choose_city")}</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <span className="homeCityChevron">
                      <ChevronDownIcon size={18} />
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSearch}
                  className="homeSearchBtn"
                  disabled={!selectedCityId}
                >
                  {searchLabel}
                </button>
              </div>
            </div>

            <div className="homeHint">
              {selectedCityId ? `${t("nav_city")}: ${selectedCityName}` : t("choose_city_hint")}
            </div>
          </div>
        </section>
      </main>

      <SeoBottomText lang={lang} cityId={selectedCityId || "global"} pageKey="home" />
      <SiteFooter />
    </div>
  );
}
