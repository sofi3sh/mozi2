"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { OrderStatus } from "@/store/orders";

export type GlobalSettings = {
  brandName: string;
  supportEmail: string;
  defaultLanguage: "ua" | "ru";

  /** Керовані сторінки (контент з адмінки) */
  pages: CmsPage[];

  /** Домени/піддомени, через які доступний сайт (white-label / різні вітрини) */
  domains: Array<{
    id: string;
    host: string;
    kind: "domain" | "subdomain";
    isPrimary: boolean;
    active: boolean;
    /** опційно: мапінг на місто/вітрину (на майбутнє) */
    cityId?: string;
  }>;

  /** Тема бренду для сайту */
  brandTheme: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl?: string;
    fontFamily?: string;
  };

  /** Фото для "Категорій" на сайті (venueTypeId -> imageUrl) */
  siteCategoryPhotos: Record<string, string>;

  /** Сторінка "Замовлення оформлено" (після оплати) */
  checkoutSuccess: {
    ua: {
      title: string;
      subtitle: string;
      message: string;
      contactsTitle: string;
      contactsHint: string;
    };
    ru: {
      title: string;
      subtitle: string;
      message: string;
      contactsTitle: string;
      contactsHint: string;
    };
    /** Номери для звʼязку (клікабельні tel:) */
    phones: string[];
  };

  /** Правила модерації контенту */
  moderation: {
    mode: "auto" | "manual";
    blockLinks: boolean;
    maxLinks: number;
    bannedWords: string[];
    action: "hide" | "review";
  };


  /** Інтеграції (спільні для всіх міст) */
  integrations: IntegrationsSettings;

  /** Налаштування піддоменів (slug міста => піддомен) */
  subdomains: SubdomainsSettings;
};

export type CmsPage = {
  id: string;
  slug: string; // e.g. "about", "terms", "contacts", "news"
  title: { ua: string; ru: string };
  content: { ua: string; ru: string };
  showInFooter: boolean;
  footerOrder: number;
};

function defaultGlobal(): GlobalSettings {
  return {
    brandName: "mozi",
    supportEmail: "support@mozi.local",
    defaultLanguage: "ua",
    pages: [
      {
        id: "about",
        slug: "about",
        title: { ua: "Про нас", ru: "О нас" },
        content: { ua: "", ru: "" },
        showInFooter: true,
        footerOrder: 10,
      },
      {
        id: "contacts",
        slug: "contacts",
        title: { ua: "Контакти", ru: "Контакты" },
        content: { ua: "", ru: "" },
        showInFooter: true,
        footerOrder: 20,
      },
      {
        id: "terms",
        slug: "terms",
        title: { ua: "Угода користувача", ru: "Пользовательское соглашение" },
        content: { ua: "", ru: "" },
        showInFooter: true,
        footerOrder: 30,
      },
    ],
    domains: [],
    brandTheme: {
      primaryColor: "#2f7bf6",
      secondaryColor: "#0b1220",
      logoUrl: "",
      faviconUrl: "",
      fontFamily: "",
    },
    siteCategoryPhotos: {},
    checkoutSuccess: {
      ua: {
        title: "Замовлення оформлено",
        subtitle: "Дякуємо за замовлення!",
        message: "Наш менеджер зв’яжеться з вами найближчим часом, щоб підтвердити деталі.",
        contactsTitle: "Є додаткові питання?",
        contactsHint: "Зателефонуйте нам за номером:",
      },
      ru: {
        title: "Заказ оформлен",
        subtitle: "Спасибо за заказ!",
        message: "Наш менеджер свяжется с вами в ближайшее время, чтобы подтвердить детали.",
        contactsTitle: "Есть вопросы?",
        contactsHint: "Позвоните нам по номеру:",
      },
      phones: [],
    },
    moderation: {
      mode: "manual",
      blockLinks: true,
      maxLinks: 0,
      bannedWords: [],
      action: "review",
    },
    integrations: {
      telegram: { enabled: false, botToken: "", chatId: "" },
      viber: { enabled: false, token: "", senderId: "" },
      payments: { enabled: false, provider: "manual", providerConfig: {} },
    },
    subdomains: {
      enabled: false,
      rootDomain: "",
      reserved: ["www", "admin", "api", "static"],
    },
  };
}

export type CityCommissions = {
  /** % комісії платформи (0-100) */
  platformPercent: number;
  /** фікс комісії платформи (у валюті міста) */
  platformFixed: number;
  /** % курʼєру/партнеру (0-100). Опційно для вашої фін.логіки */
  courierPercent: number;
  /** фікс курʼєру/партнеру (у валюті міста). Опційно */
  courierFixed: number;
};

export type GeoZone = {
  id?: string;
  name: string;
  deliveryFee: number;
  minOrderAmount?: number;
  etaMinutes?: number;
  /**
   * Геометрія зони (MVP): будь-який JSON.
   * Приклад: { type: "circle", center: [lng, lat], radiusMeters: 4000 }
   * або GeoJSON Polygon.
   */
  shape?: any;
  [k: string]: any;
};

export type DeliverySchedule = {
  timezone?: string;
  /**
   * 0..6 (0=Нд, 1=Пн...). MVP: прості інтервали.
   */
  week: Array<{ day: number; enabled: boolean; from: string; to: string }>;
  /** Винятки (свята/переноси) */
  exceptions?: Array<{ date: string; enabled: boolean; from?: string; to?: string; note?: string }>;
  [k: string]: any;
};

export type PaymentsSettings = {
  methods: {
    cash: boolean;
    cardOnDelivery: boolean;
    online: boolean;
    [k: string]: any;
  };
  /** manual / liqpay / wayforpay / stripe ... */
  provider?: string;
  providerConfig?: any;
  [k: string]: any;
};

export type TaxesSettings = {
  vatPercent: number;
  includedInPrice: boolean;
  [k: string]: any;
};

export type IntegrationsSettings = {
  telegram?: { enabled: boolean; botToken?: string; chatId?: string; [k: string]: any };
  viber?: { enabled: boolean; token?: string; senderId?: string; [k: string]: any };
  payments?: { enabled: boolean; provider?: string; providerConfig?: any; [k: string]: any };
  [k: string]: any;
};

export type SubdomainsSettings = {
  enabled: boolean;
  rootDomain: string;
  reserved: string[];
  [k: string]: any;
};

export type NotificationTemplate = {
  telegramText: string;
  emailSubject: string;
  emailBody: string;
  webhookPayload: string;
};

export type NotificationsSettings = {
  telegram: { enabled: boolean; botToken: string; chatId: string };
  email: { enabled: boolean; from: string; to: string };
  webhooks: { enabled: boolean; urls: string[] };
  templates: Record<OrderStatus, NotificationTemplate>;
  [k: string]: any;
};

export type CitySettings = {
  cityId: string;
  currency: "UAH";
  timezone: string;
  orderAutoAccept: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  minOrderAmount: number;

  commissions: CityCommissions;
  geozones: GeoZone[];
  deliverySchedule: DeliverySchedule;
  payments: PaymentsSettings;
  taxes: TaxesSettings;
  integrations: IntegrationsSettings;
  notifications: NotificationsSettings;
};

type Ctx = {
  global: GlobalSettings;
  citySettings: CitySettings[];

  getCity: (cityId: string) => CitySettings;
  updateGlobal: (patch: Partial<GlobalSettings>) => void;
  updateCity: (cityId: string, patch: Partial<Omit<CitySettings, "cityId">>) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

function defaultCity(cityId: string): CitySettings {
  const templates: Record<OrderStatus, NotificationTemplate> = {
    preorder: {
      telegramText: "Передзамовлення №{{order_number}} • доставка на {{deliver_at}}\nСума: {{total}}\nАдреса: {{address}}\nКоментар: {{comment}}",
      emailSubject: "Передзамовлення №{{order_number}}",
      emailBody: "Передзамовлення №{{order_number}}\nДоставка на: {{deliver_at}}\nСума: {{total}}\nАдреса: {{address}}\n\nКоментар: {{comment}}",
      webhookPayload: "{\n  \"status\": \"preorder\",\n  \"order_number\": \"{{order_number}}\",\n  \"deliver_at\": \"{{deliver_at}}\"\n}",
    },
    new: {
      telegramText: "Нове замовлення №{{order_number}}\nСума: {{total}}\nАдреса: {{address}}\nКоментар: {{comment}}",
      emailSubject: "Нове замовлення №{{order_number}}",
      emailBody: "Нове замовлення №{{order_number}}\nСума: {{total}}\nАдреса: {{address}}\n\nКоментар: {{comment}}",
      webhookPayload: "{\n  \"status\": \"new\",\n  \"order_number\": \"{{order_number}}\"\n}",
    },
    in_progress: {
      telegramText: "Замовлення №{{order_number}} в роботі",
      emailSubject: "Замовлення №{{order_number}} — в роботі",
      emailBody: "Замовлення №{{order_number}} в роботі.",
      webhookPayload: "{\n  \"status\": \"in_progress\",\n  \"order_number\": \"{{order_number}}\"\n}",
    },
    delivered: {
      telegramText: "Замовлення №{{order_number}} доставлено ✅",
      emailSubject: "Замовлення №{{order_number}} доставлено",
      emailBody: "Замовлення №{{order_number}} доставлено.",
      webhookPayload: "{\n  \"status\": \"delivered\",\n  \"order_number\": \"{{order_number}}\"\n}",
    },
    cancelled: {
      telegramText: "Замовлення №{{order_number}} скасовано ❌\nПричина: {{cancel_reason}}",
      emailSubject: "Замовлення №{{order_number}} скасовано",
      emailBody: "Замовлення №{{order_number}} скасовано.\nПричина: {{cancel_reason}}",
      webhookPayload: "{\n  \"status\": \"cancelled\",\n  \"order_number\": \"{{order_number}}\",\n  \"cancel_reason\": \"{{cancel_reason}}\"\n}",
    },
  };

  return {
    cityId,
    currency: "UAH",
    timezone: "Europe/Kyiv",
    orderAutoAccept: false,
    deliveryEnabled: true,
    pickupEnabled: true,
    minOrderAmount: 0,

    commissions: {
      platformPercent: 0,
      platformFixed: 0,
      courierPercent: 0,
      courierFixed: 0,
    },
    geozones: [],
    deliverySchedule: {
      timezone: "Europe/Kyiv",
      week: [
        { day: 1, enabled: true, from: "09:00", to: "21:00" },
        { day: 2, enabled: true, from: "09:00", to: "21:00" },
        { day: 3, enabled: true, from: "09:00", to: "21:00" },
        { day: 4, enabled: true, from: "09:00", to: "21:00" },
        { day: 5, enabled: true, from: "09:00", to: "21:00" },
        { day: 6, enabled: true, from: "10:00", to: "20:00" },
        { day: 0, enabled: true, from: "10:00", to: "20:00" },
      ],
      exceptions: [],
    },
    payments: {
      methods: { cash: true, cardOnDelivery: true, online: false },
      provider: "manual",
      providerConfig: {},
    },
    taxes: { vatPercent: 0, includedInPrice: true },
    integrations: {
      telegram: { enabled: false, botToken: "", chatId: "" },
      viber: { enabled: false, token: "", senderId: "" },
      payments: { enabled: false, provider: "manual", providerConfig: {} },
    },
    notifications: {
      telegram: { enabled: false, botToken: "", chatId: "" },
      email: { enabled: false, from: "", to: "" },
      webhooks: { enabled: false, urls: [] },
      templates,
    },
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [global, setGlobal] = useState<GlobalSettings>(defaultGlobal());

  const [citySettings, setCitySettings] = useState<CitySettings[]>([]);

  async function refresh() {
    try {
      const g = await api<{ settings: any[] }>("/api/settings?scope=global");
      const globalRow = (g.settings || []).find((s) => s.key === "global");
      if (globalRow?.value) setGlobal({ ...defaultGlobal(), ...(globalRow.value as Partial<GlobalSettings>) } as GlobalSettings);
    } catch {}

    try {
      const c = await api<{ settings: any[] }>("/api/settings?scope=city");
      const rows = Array.isArray(c.settings) ? c.settings : [];
      const mapped: CitySettings[] = rows
        .filter((r) => r.key === "city" && r.cityId)
        .map((r) => ({ ...defaultCity(r.cityId), ...(r.value || {}), cityId: r.cityId }));
      setCitySettings(mapped);
    } catch {}
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      global,
      citySettings,
      getCity: (cityId) => {
        const city = citySettings.find((c) => c.cityId === cityId) ?? defaultCity(cityId);
        // integrations — спільні для всіх міст (беремо з global)
        return { ...city, integrations: global.integrations ?? city.integrations };
      },
      updateGlobal: (patch) => {
        setGlobal((g) => {
          const next = { ...g, ...patch };
          api("/api/settings", { method: "POST", body: JSON.stringify({ scope: "global", cityId: null, key: "global", value: next }) }).catch(() => {});
          return next;
        });
      },
      updateCity: (cityId, patch) => {
        setCitySettings((prev) => {
          const existing = prev.find((c) => c.cityId === cityId) ?? defaultCity(cityId);
          const next = { ...existing, ...patch, cityId };
          const out = prev.some((c) => c.cityId === cityId) ? prev.map((c) => (c.cityId === cityId ? next : c)) : [next, ...prev];
          api("/api/settings", { method: "POST", body: JSON.stringify({ scope: "city", cityId, key: "city", value: { ...next, cityId: undefined } }) }).catch(() => {});
          return out;
        });
      },
    }),
    [global, citySettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
