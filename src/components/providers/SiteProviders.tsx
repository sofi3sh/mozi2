"use client";

import React from "react";
import { CityScopeProvider } from "@/store/cityScope";
import { CatalogProvider } from "@/store/catalog";
import { VenuesProvider } from "@/store/venues";
import { MenuProvider } from "@/store/menu";
import { CartProvider } from "@/store/cart";
import { SeoProvider } from "@/store/seo";
import { SiteLangProvider } from "@/store/siteLang";
import { SettingsProvider } from "@/store/settings";

export default function SiteProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
    <SeoProvider>
      <SiteLangProvider>
        <CityScopeProvider>
          <CatalogProvider>
            <VenuesProvider>
              <MenuProvider>
                <CartProvider>{children}</CartProvider>
              </MenuProvider>
            </VenuesProvider>
          </CatalogProvider>
        </CityScopeProvider>
      </SiteLangProvider>
    </SeoProvider>
    </SettingsProvider>
  );
}
