"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";
import { useCityScope } from "@/store/cityScope";
import { useCart, formatMoneyUAH } from "@/store/cart";

/**
 * Sticky bottom cart bar for mobile.
 * - Shows only on small screens via CSS.
 * - Avoids cart/checkout pages to prevent UI duplication.
 */
export default function SiteMobileCartBar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { lang } = useSiteLang();
  const { t } = useSiteT();
  const { hostCityId, currentCityId, subdomainsEnabled, rootDomain } = useCityScope();
  const { hydrated, itemCount, cityTotal } = useCart();

  const cityId = hostCityId || currentCityId || "";

  // Hide on pages where the user is already managing the cart / checkout.
  if (
    pathname.includes("/cart") ||
    pathname.includes("/checkout") ||
    pathname.includes("/admin") ||
    pathname.includes("/login") ||
    pathname.includes("/auth")
  ) {
    return null;
  }

  if (!hydrated || !cityId) return null;

  const count = itemCount(cityId);
  if (count <= 0) return null;

  const total = cityTotal(cityId);
  const useQueryCity = !(subdomainsEnabled && rootDomain);
  const cartHref = `/${lang}/cart${useQueryCity && cityId ? `?city=${encodeURIComponent(cityId)}` : ""}`;

  return (
    <>
      {/* Spacer so content is not hidden under the fixed bar */}
      <div className="siteMobileCartSpacer" aria-hidden="true" />
      <div className="siteMobileCartBar" role="region" aria-label={t("cart")}>
        <button
          type="button"
          className="siteMobileCartBtn"
          onClick={() => router.push(cartHref)}
        >
          <div className="siteMobileCartBtnLeft">
            <div className="siteMobileCartBtnTitle">
              {t("cart")} · {count}
            </div>
            <div className="siteMobileCartBtnSubtitle">
              {lang === "ru" ? "Перейти к оформлению" : "Перейти до оформлення"}
            </div>
          </div>
          <div className="siteMobileCartBtnRight">{formatMoneyUAH(total)}</div>
        </button>
      </div>
    </>
  );
}
