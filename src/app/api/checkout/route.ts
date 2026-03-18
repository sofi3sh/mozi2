import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../_util";
import { earliestDeliveryAt, isOpenAt } from "@/lib/site/deliveryTime";

export const runtime = "nodejs";

const GLOBAL_CITY_ID = "global";

type InSelection = {
  groupId: string;
  optionIds: string[];
};

type InItem = {
  dishId: string;
  qty: number;
  selections?: InSelection[];
};

type InVenue = {
  venueId: string;
  delivery?: { mode?: "asap" | "time"; deliverAtISO?: string };
  items: InItem[];
};

type InCustomer = { name: string; phone?: string; email?: string };

type InAddress = {
  street: string;
  house: string;
  flat?: string;
  comment?: string;
};

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function s(v: any) {
  return String(v ?? "").trim();
}

function normCustomer(raw: any): InCustomer {
  return {
    name: s(raw?.name),
    phone: s(raw?.phone),
    email: s(raw?.email),
  };
}

function normAddress(raw: any): InAddress {
  return {
    street: s(raw?.street),
    house: s(raw?.house),
    flat: s(raw?.flat),
    comment: s(raw?.comment),
  };
}

function parseDateISO(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(String(iso));
  return Number.isFinite(d.getTime()) ? d : null;
}

function uniqueStrings(xs: any): string[] {
  if (!Array.isArray(xs)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of xs) {
    const v = s(x);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

async function getPaymentsConfig() {
  const row = await prisma.setting.findUnique({
    where: { scope_cityId_key: { scope: "global", cityId: GLOBAL_CITY_ID, key: "global" } },
  });

  const val: any = row?.value ?? {};
  const payments = val?.integrations?.payments ?? val?.integrations?.payment ?? val?.payments ?? {};

  return {
    enabled: Boolean(payments?.enabled ?? false),
    provider: s(payments?.provider) || "manual",
    providerConfig: payments?.providerConfig ?? {},
  };
}

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return badRequest("Invalid JSON");

  const cityId = s(body?.cityId);
  if (!cityId) return badRequest("cityId обовʼязковий");

  const customer = normCustomer(body?.customer);
  const address = normAddress(body?.address);

  if (customer.name.length < 2) return badRequest("Вкажіть імʼя");
  if ((customer.phone ?? "").length < 6) return badRequest("Вкажіть телефон");
  if (!address.street || !address.house) return badRequest("Заповніть адресу (вулиця та будинок)");

  const venuesIn: InVenue[] = Array.isArray(body?.venues) ? body.venues : [];
  if (!venuesIn.length) return badRequest("Корзина порожня");

  // Payments settings (global)
  const payCfg = await getPaymentsConfig();
  if (!payCfg.enabled) {
    return badRequest(
      "Оплата онлайн вимкнена. Увімкніть в адмінці: Загальні → Інтеграції → Платіжний метод.",
      { code: "PAYMENTS_DISABLED" }
    );
  }

  // Basic city existence check (optional)
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) return badRequest("Місто не знайдено");

  const now = new Date();

  // Preload venues
  const venueIds = uniqueStrings(venuesIn.map((v) => v?.venueId));
  const venues = await prisma.venue.findMany({
    where: { id: { in: venueIds }, cityId },
    select: { id: true, name: true, deliveryMinutes: true, schedule: true },
  });
  const venueMap = new Map(venues.map((v) => [v.id, v]));

  for (const vid of venueIds) {
    if (!venueMap.has(vid)) return badRequest(`Заклад не знайдено або не належить місту: ${vid}`);
  }

  // Build computed orders (validate + compute totals)
  const computedOrders: Array<{
    venueId: string;
    deliverAt: Date;
    deliveryMode: "asap" | "time";
    status: string;
    total: number;
    items: any[];
  }> = [];

  for (const vIn of venuesIn) {
    const venueId = s(vIn?.venueId);
    const v = venueMap.get(venueId);
    if (!venueId || !v) continue;

    const itemsIn: InItem[] = Array.isArray(vIn?.items) ? vIn.items : [];
    const cleanItems = itemsIn
      .map((it) => ({
        dishId: s(it?.dishId),
        qty: Math.max(1, toInt(it?.qty, 1)),
        selections: Array.isArray(it?.selections)
          ? it.selections.map((sel) => ({ groupId: s(sel?.groupId), optionIds: uniqueStrings(sel?.optionIds) }))
          : [],
      }))
      .filter((it) => it.dishId && it.qty > 0);

    if (!cleanItems.length) continue;

    // Fetch dishes for this venue
    const dishIds = uniqueStrings(cleanItems.map((it) => it.dishId));
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds }, cityId, venueId },
      select: { id: true, name: true, price: true, isStopped: true, modifierGroupIds: true },
    });
    const dishMap = new Map(dishes.map((d) => [d.id, d]));

    for (const did of dishIds) {
      const d = dishMap.get(did);
      if (!d) return badRequest(`Страва не знайдена: ${did}`);
      if (d.isStopped) return badRequest(`Страва тимчасово недоступна: ${d.name}`);
    }

    // Collect all modifier group IDs potentially needed
    const allGroupIds = new Set<string>();
    for (const it of cleanItems) {
      const d = dishMap.get(it.dishId);
      const ids = Array.isArray(d?.modifierGroupIds) ? d!.modifierGroupIds.map(String) : [];
      ids.forEach((x) => allGroupIds.add(String(x)));

      // Also include what client sent (defense)
      for (const sel of it.selections || []) if (sel.groupId) allGroupIds.add(sel.groupId);
    }

    const groupIds = [...allGroupIds];
    const groups = groupIds.length
      ? await prisma.modifierGroup.findMany({
          where: { id: { in: groupIds }, cityId, venueId },
          select: { id: true, title: true, required: true, minSelect: true, maxSelect: true, options: true },
        })
      : [];
    const groupMap = new Map(groups.map((g) => [g.id, g]));

    // Delivery time
    const mode: "asap" | "time" = vIn?.delivery?.mode === "time" ? "time" : "asap";
    const requestedAt = parseDateISO(vIn?.delivery?.deliverAtISO);
    const lead = Math.max(0, Math.round(Number(v.deliveryMinutes ?? 0) || 0));
    const earliest = earliestDeliveryAt(v.schedule as any, lead, now);
    const openNow = isOpenAt(v.schedule as any, now);

    if (!openNow && mode !== "time") {
      return badRequest(`Заклад “${v.name}” зачинено — потрібно обрати час доставки.`, {
        code: "VENUE_CLOSED",
        venueId,
      });
    }

    let deliverAt: Date | null = null;

    if (mode === "time") {
      if (!requestedAt) return badRequest(`Оберіть час доставки для “${v.name}”.`, { code: "MISSING_DELIVER_AT", venueId });
      deliverAt = requestedAt;
      if (earliest && deliverAt.getTime() < earliest.getTime()) {
        return badRequest(`Час доставки для “${v.name}” занадто ранній.`, {
          code: "DELIVER_AT_TOO_EARLY",
          venueId,
          earliest: earliest.toISOString(),
        });
      }
    } else {
      deliverAt = earliest ?? new Date(now.getTime() + lead * 60_000);
    }

    // Compute items + totals
    let venueTotal = 0;
    const outItems: any[] = [];

    for (const it of cleanItems) {
      const d = dishMap.get(it.dishId)!;
      const basePrice = Math.max(0, toInt(d.price, 0));

      // Map selections by groupId
      const selMap = new Map<string, string[]>();
      for (const sel of it.selections || []) {
        const gid = s(sel.groupId);
        if (!gid) continue;
        selMap.set(gid, uniqueStrings(sel.optionIds));
      }

      // Validate required/min/max for groups attached to dish
      const dishGroupIds = Array.isArray(d.modifierGroupIds) ? d.modifierGroupIds.map(String) : [];
      const selectionDetails: any[] = [];
      // Additive modifiers (ingredients) vs full-price variations (VAR:: groups).
      // In VAR:: groups option.priceDelta is stored as FULL price for that variation,
      // so it must REPLACE the dish base price, not be added on top of it.
      let additiveDeltaSum = 0;
      let resolvedBasePrice = basePrice;

      for (const gid of dishGroupIds) {
        const g = groupMap.get(gid);
        if (!g) continue;
        const chosen = uniqueStrings(selMap.get(gid) ?? []);
        const effectiveMin = Math.max(0, toInt(g.minSelect, 0), g.required ? 1 : 0);
        const max = Math.max(1, toInt(g.maxSelect, 1));

        if (chosen.length < effectiveMin) {
          return badRequest(`Потрібно обрати щонайменше ${effectiveMin} опц. для “${d.name}” (${g.title}).`, {
            code: "MODIFIERS_MIN",
            dishId: d.id,
            groupId: g.id,
          });
        }
        if (chosen.length > max) {
          return badRequest(`Забагато опцій для “${d.name}” (${g.title}).`, {
            code: "MODIFIERS_MAX",
            dishId: d.id,
            groupId: g.id,
          });
        }

        const options = Array.isArray(g.options) ? (g.options as any[]) : [];
        const optMap = new Map(options.map((o) => [String(o?.id ?? ""), o]));

        const pickedTitles: string[] = [];
        let groupDelta = 0;

        for (const oid of chosen) {
          const opt = optMap.get(oid);
          if (!opt) return badRequest(`Невірна опція модифікатора для “${d.name}”.`, { code: "MODIFIER_OPTION_INVALID", dishId: d.id, groupId: g.id, optionId: oid });
          if (opt?.isStopped) return badRequest(`Опція “${opt?.name}” тимчасово недоступна.`, { code: "MODIFIER_OPTION_STOPPED", dishId: d.id, groupId: g.id, optionId: oid });
          pickedTitles.push(String(opt?.name ?? ""));
          groupDelta += toInt(opt?.priceDelta, 0);
        }

        const groupTitle = String(g.title ?? "");
        const normGroupTitle = groupTitle.trim();
        const minSelect = toInt(g.minSelect, 0);
        const maxSelect = toInt(g.maxSelect, 1);
        // VAR:: groups are stored with FULL price in option.priceDelta.
        // Sometimes titles may contain extra whitespace/encoding, so we detect by both prefix and constraints.
        const isVariationGroup =
          /^VAR::/i.test(normGroupTitle) ||
          (Boolean(g.required) && minSelect === 1 && maxSelect === 1);
        if (isVariationGroup) {
          // FULL price overrides base dish price.
          resolvedBasePrice = Math.max(0, Math.round(groupDelta));
        } else {
          // Regular modifiers are additive.
          additiveDeltaSum += groupDelta;
        }
        if (chosen.length) {
          selectionDetails.push({
            groupId: g.id,
            groupTitle: String(g.title ?? ""),
            optionIds: chosen,
            optionTitles: pickedTitles,
            priceDeltaSum: Math.round(groupDelta),
          });
        }
      }

      const unitPrice = Math.max(0, Math.round(resolvedBasePrice + additiveDeltaSum));
      const lineTotal = Math.max(0, Math.round(unitPrice * it.qty));
      venueTotal += lineTotal;

      outItems.push({
        dishId: d.id,
        name: String(d.name ?? ""),
        qty: it.qty,
        basePrice,
        selections: selectionDetails,
        unitPrice,
        lineTotal,
      });
    }

    const status = mode === "time" || !openNow ? "preorder" : "new";

    computedOrders.push({
      venueId,
      deliverAt: deliverAt!,
      deliveryMode: mode,
      status,
      total: Math.round(venueTotal),
      items: outItems,
    });
  }

  if (!computedOrders.length) return badRequest("Корзина порожня");

  const amount = computedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

  // Allocate order numbers
  const max = await prisma.order.aggregate({ where: { cityId }, _max: { number: true } });
  let nextNumber = (max._max.number ?? 1024) + 1;

  const deliveryAddress = {
    street: address.street,
    house: address.house,
    flat: address.flat ?? "",
    comment: address.comment ?? "",
  };

  // Create customer, payment, and orders
  const result = await prisma.$transaction(async (tx) => {
    // try reuse by phone (optional)
    let cust = null as any;
    const phone = s(customer.phone);
    if (phone) {
      cust = await tx.customer.findFirst({ where: { cityId, phone } });
      if (cust) {
        cust = await tx.customer.update({
          where: { id: cust.id },
          data: { name: customer.name, email: s(customer.email) || cust.email },
        });
      }
    }
    if (!cust) {
      cust = await tx.customer.create({
        data: { cityId, name: customer.name, phone: s(customer.phone), email: s(customer.email) },
      });
    }

    const payment = await tx.payment.create({
      data: {
        cityId,
        provider: payCfg.provider,
        currency: "UAH",
        amount: Math.round(amount),
        status: "paid", // demo: paid instantly
        providerPayload: payCfg.providerConfig ?? {},
      },
    });

    const createdOrders: any[] = [];

    for (const o of computedOrders) {
      const created = await tx.order.create({
        data: {
          number: nextNumber++,
          cityId,
          venueId: o.venueId,
          customerId: cust.id,
          paymentId: payment.id,
          total: o.total,
          status: o.status,
          paymentStatus: payment.status,
          paymentProvider: payment.provider,
          deliveryMode: o.deliveryMode,
          deliverAt: o.deliverAt,
          deliveryAddress,
          items: o.items,
        },
        select: { id: true, number: true, venueId: true, total: true },
      });
      createdOrders.push(created);
    }

    return { customer: { id: cust.id }, payment, orders: createdOrders };
  });

  return json({
    payment: { id: result.payment.id, amount: result.payment.amount, status: result.payment.status, provider: result.payment.provider },
    orders: result.orders,
  }, 201);
}
