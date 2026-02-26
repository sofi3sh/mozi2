"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";
import { City, useCityScope } from "@/store/cityScope";
import { useCart } from "@/store/cart";
import { ChevronDownIcon, CartIcon, PinIcon } from "@/components/site/SiteIcons";
import { MenuIcon, CloseIcon } from "@/components/site/SiteIcons";

export default function SiteHeader({
  cities,
  selectedCityId,
  onSelectCity,
}: {
  cities: City[];
  selectedCityId: string;
  onSelectCity: (id: string) => void;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { lang, setLang } = useSiteLang();
  const { t } = useSiteT();
  const { subdomainsEnabled, rootDomain, navigateToCitySubdomain } = useCityScope();
  const { itemCount } = useCart();
  const cartCount = itemCount(selectedCityId);

  const useQueryCity = !(subdomainsEnabled && rootDomain);
  const categoriesBase = `/${lang}/categories`;
  const categoriesHref = useQueryCity && selectedCityId ? `${categoriesBase}?city=${encodeURIComponent(selectedCityId)}` : categoriesBase;
  const venuesBase = `/${lang}/venues`;
  const venuesHref = useQueryCity && selectedCityId ? `${venuesBase}?city=${encodeURIComponent(selectedCityId)}` : venuesBase;

  const cartHref = `/${lang}/cart${useQueryCity && selectedCityId ? `?city=${encodeURIComponent(selectedCityId)}` : ""}`;

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <header className="siteHeader">
        <div className="siteContainer siteHeaderInner">
          <div className="siteHeaderLeft">
            {/* Mobile burger */}
            <button
              type="button"
              className="siteIconBtn siteBurger"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
            </button>

            {/* Logo веде на "Категорії" */}
            <Link href={categoriesHref} onClick={closeMobile} style={{ display: "flex", alignItems: "center" }}>
              <Image src="/brand-photo.png" alt="brand" width={122} height={122} priority className="siteLogo" />
            </Link>
          </div>

          <nav className="siteNav" aria-label="Primary">
            <Link href={venuesHref}>{t("nav_venues")}</Link>

            <div className="siteSelectWrap">
              <select
                className="siteSelect siteSelect--city"
                value={selectedCityId}
                onChange={(e) => {
                  const next = e.target.value;
                  onSelectCity(next);
                  // У режимі піддоменів — одразу переходимо на інший піддомен (це очікувана дія користувача)
                  if (subdomainsEnabled && rootDomain) {
                    navigateToCitySubdomain(next, { preservePath: true, fallbackPath: "/venues" });
                  }
                }}
              >
                <option value="" disabled hidden style={{ display: "none" }}>
                  {t("nav_city")}
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="siteSelectIconLeft">
                <PinIcon size={18} />
              </span>
              <span className="siteSelectIconRight">
                <ChevronDownIcon size={18} />
              </span>
            </div>

            <Link href={categoriesHref}>{t("nav_categories")}</Link>
          </nav>

          <div className="siteActions">
            <div className="siteSelectWrap">
              <select
                className="siteSelect siteSelect--lang"
                value={lang === "ua" ? "UA" : "RU"}
                onChange={(e) => setLang(e.target.value === "RU" ? "ru" : "ua")}
                aria-label="Language"
              >
                <option value="UA">UA</option>
                <option value="RU">RU</option>
              </select>
              <span className="siteSelectIconRight" style={{ right: 12 }}>
                <ChevronDownIcon size={18} />
              </span>
            </div>

            <button
              type="button"
              aria-label={t("cart")}
              className="siteIconBtn"
              onClick={() => {
                closeMobile();
                router.push(cartHref);
              }}
            >
              <CartIcon size={18} />
              {cartCount > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    minWidth: 18,
                    height: 18,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: "#e6a24a",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 950,
                    boxShadow: "0 10px 22px rgba(230,162,74,0.25)",
                  }}
                >
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <>
          <div className="siteMobileOverlay" onClick={closeMobile} aria-hidden="true" />
          <div className="siteMobilePanel" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="siteMobileTop">
              <div className="siteMobileTitle">{t("nav_categories")}</div>
              <button type="button" className="siteIconBtn" onClick={closeMobile} aria-label="Close">
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="siteMobileBody">
              <div className="siteMobileLinks">
                <Link className="siteMobileLink" href={venuesHref} onClick={closeMobile}>
                  {t("nav_venues")}
                </Link>
                <Link className="siteMobileLink" href={categoriesHref} onClick={closeMobile}>
                  {t("nav_categories")}
                </Link>
                <Link className="siteMobileLink" href={cartHref} onClick={closeMobile}>
                  {t("cart")}{cartCount > 0 ? ` (${cartCount})` : ""}
                </Link>
              </div>

              <div className="siteMobileRow">
                <div className="siteSelectWrap">
                  <select
                    className="siteSelect siteSelect--city"
                    value={selectedCityId}
                    onChange={(e) => {
                      const next = e.target.value;
                      onSelectCity(next);
                      if (subdomainsEnabled && rootDomain) {
                        navigateToCitySubdomain(next, { preservePath: true, fallbackPath: "/venues" });
                      }
                    }}
                  >
                    <option value="" disabled hidden style={{ display: "none" }}>
                      {t("nav_city")}
                    </option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="siteSelectIconLeft">
                    <PinIcon size={18} />
                  </span>
                  <span className="siteSelectIconRight">
                    <ChevronDownIcon size={18} />
                  </span>
                </div>

                <div className="siteSelectWrap">
                  <select
                    className="siteSelect siteSelect--lang"
                    value={lang === "ua" ? "UA" : "RU"}
                    onChange={(e) => setLang(e.target.value === "RU" ? "ru" : "ua")}
                    aria-label="Language"
                  >
                    <option value="UA">UA</option>
                    <option value="RU">RU</option>
                  </select>
                  <span className="siteSelectIconRight" style={{ right: 12 }}>
                    <ChevronDownIcon size={18} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
