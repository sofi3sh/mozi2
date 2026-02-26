import type { WorkDay, WorkSchedule, ScheduleException } from "@/store/venues";

type AnySchedule = WorkDay[] | WorkSchedule | undefined | null;

function dayKey(d: number): WorkDay["day"] {
  // JS Date: 0=sun..6=sat
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[d];
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseHM(hm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hm || "").trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function setTime(base: Date, hm: string) {
  const minutes = parseHM(hm);
  const d = new Date(base);
  if (minutes === null) return d;
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

function normalizeSchedule(schedule: AnySchedule): { days: WorkDay[]; exceptions: ScheduleException[] } {
  if (Array.isArray(schedule)) return { days: schedule, exceptions: [] };
  const days = Array.isArray((schedule as any)?.days) ? ((schedule as any).days as WorkDay[]) : [];
  const exceptions = Array.isArray((schedule as any)?.exceptions)
    ? ((schedule as any).exceptions as ScheduleException[])
    : [];
  return { days, exceptions };
}

function rangeForDate(schedule: AnySchedule, date: Date) {
  const { days, exceptions } = normalizeSchedule(schedule);
  const iso = toISODate(date);
  const ex = exceptions.find((x) => x?.date === iso);
  if (ex) {
    return {
      has: true,
      isClosed: !!ex.isClosed,
      open: ex.open || "",
      close: ex.close || "",
      note: ex.note || "",
    };
  }

  const dk = dayKey(date.getDay());
  const wd = days.find((x) => x.day === dk);
  if (!wd) return { has: false, isClosed: false, open: "", close: "", note: "" };
  return { has: true, isClosed: !!wd.isClosed, open: wd.open || "", close: wd.close || "", note: "" };
}

export function isOpenAt(schedule: AnySchedule, at: Date) {
  const r = rangeForDate(schedule, at);
  if (!r.has) return true;
  if (r.isClosed) return false;
  const t = at.getHours() * 60 + at.getMinutes();
  const openM = parseHM(r.open) ?? 0;
  const closeM = parseHM(r.close) ?? 24 * 60 - 1;
  return t >= openM && t <= closeM;
}

/**
 * Returns the next moment when the venue is open.
 * - If it's open now, returns `from`.
 * - If closed, returns next open day at opening time.
 */
export function nextOpenAt(schedule: AnySchedule, from: Date): Date | null {
  const start = new Date(from);
  for (let i = 0; i < 14; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    day.setHours(0, 0, 0, 0);

    const r = rangeForDate(schedule, day);
    if (!r.has || r.isClosed) continue;

    const openAt = setTime(day, r.open || "00:00");
    const closeAt = setTime(day, r.close || "23:59");

    if (i === 0) {
      if (from <= closeAt && from >= openAt) return new Date(from);
      if (from < openAt) return openAt;
    } else {
      return openAt;
    }
  }
  return null;
}

/**
 * Earliest possible delivery time given deliveryMinutes.
 * If venue is closed, returns first available slot after next open.
 */
export function earliestDeliveryAt(schedule: AnySchedule, deliveryMinutes: number, now: Date): Date | null {
  const lead = Math.max(0, Math.round(Number(deliveryMinutes) || 0));
  const openMoment = nextOpenAt(schedule, now);
  if (!openMoment) return null;

  // Candidate = openMoment + lead
  let cand = new Date(openMoment.getTime() + lead * 60_000);

  // Ensure candidate is within an open range. If it overflows today's closing, move to next open day.
  for (let i = 0; i < 14; i++) {
    const r = rangeForDate(schedule, cand);
    if (!r.has || r.isClosed) {
      const next = nextOpenAt(schedule, new Date(cand.getTime() + 24 * 60 * 60_000));
      if (!next) return null;
      cand = new Date(next.getTime() + lead * 60_000);
      continue;
    }

    const openAt = setTime(cand, r.open || "00:00");
    const closeAt = setTime(cand, r.close || "23:59");
    if (cand < openAt) cand = openAt;
    if (cand <= closeAt) return cand;

    const next = nextOpenAt(schedule, new Date(closeAt.getTime() + 60_000));
    if (!next) return null;
    cand = new Date(next.getTime() + lead * 60_000);
  }

  return null;
}

export function deliverySlots(
  schedule: AnySchedule,
  deliveryMinutes: number,
  now: Date,
  opts?: { stepMinutes?: number; count?: number }
) {
  const step = Math.max(5, Math.round(Number(opts?.stepMinutes ?? 15) || 15));
  const count = Math.max(1, Math.round(Number(opts?.count ?? 18) || 18));
  const start = earliestDeliveryAt(schedule, deliveryMinutes, now);
  if (!start) return [] as Date[];

  const out: Date[] = [];
  let cur = new Date(start);

  for (let guard = 0; guard < 200 && out.length < count; guard++) {
    const r = rangeForDate(schedule, cur);
    if (!r.has || r.isClosed) {
      const next = nextOpenAt(schedule, new Date(cur.getTime() + 60_000));
      if (!next) break;
      cur = next;
      continue;
    }
    const openAt = setTime(cur, r.open || "00:00");
    const closeAt = setTime(cur, r.close || "23:59");
    if (cur < openAt) cur = openAt;
    if (cur > closeAt) {
      const next = nextOpenAt(schedule, new Date(closeAt.getTime() + 60_000));
      if (!next) break;
      cur = next;
      continue;
    }

    out.push(new Date(cur));
    cur = new Date(cur.getTime() + step * 60_000);
  }

  return out;
}

export function formatSlotLocal(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const iso = toISODate(d);
  return { label: `${hh}:${mm}`, isoDate: iso };
}


export function dayOpenClose(schedule: AnySchedule, date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const r = rangeForDate(schedule, day);
  if (!r.has || r.isClosed) return null as null | { openAt: Date; closeAt: Date; note?: string };
  const openAt = setTime(day, r.open || "00:00");
  const closeAt = setTime(day, r.close || "23:59");
  return { openAt, closeAt, note: r.note || "" };
}
