"use client";

import { SessionProvider } from "@/store/session";
import { CityScopeProvider } from "@/store/cityScope";
import { CatalogProvider } from "@/store/catalog";
import { VenuesProvider } from "@/store/venues";
import { MenuProvider } from "@/store/menu";
import { OrdersProvider } from "@/store/orders";
import { CustomersProvider } from "@/store/customers";
import { UsersProvider } from "@/store/users";
import { SettingsProvider } from "@/store/settings";
import { SeoProvider } from "@/store/seo";

export default function AdminProviders({ children }: { children: React.ReactNode }) {
  // IMPORTANT: CityScopeProvider (and potentially other stores) rely on global settings.
  // So SettingsProvider must wrap the whole admin tree, otherwise hooks will throw.
  return (
    <SettingsProvider>
      <SeoProvider>
        <SessionProvider>
          <CityScopeProvider>
            <CatalogProvider>
              <VenuesProvider>
                <MenuProvider>
                  <CustomersProvider>
                    <OrdersProvider>
                      <UsersProvider>{children}</UsersProvider>
                    </OrdersProvider>
                  </CustomersProvider>
                </MenuProvider>
              </VenuesProvider>
            </CatalogProvider>
          </CityScopeProvider>
        </SessionProvider>
      </SeoProvider>
    </SettingsProvider>
  );
}
