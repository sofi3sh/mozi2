export type WorkDay = {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  isClosed: boolean;
  open: string;
  close: string;
};

export type ScheduleException = {
  /** YYYY-MM-DD */
  date: string;
  isClosed: boolean;
  open: string;
  close: string;
  note?: string;
};

export type WorkSchedule = {
  days: WorkDay[];
  exceptions: ScheduleException[];
};

function dayKey(d: number): WorkDay["day"] {
  // JS Date: 0=sun..6=sat
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[d];
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalize(schedule: WorkDay[] | WorkSchedule | undefined | null): WorkSchedule {
  if (Array.isArray(schedule)) return { days: schedule, exceptions: [] };
  const days = Array.isArray((schedule as any)?.days) ? ((schedule as any).days as WorkDay[]) : [];
  const exceptions = Array.isArray((schedule as any)?.exceptions)
    ? ((schedule as any).exceptions as ScheduleException[])
    : [];
  return { days, exceptions };
}

export function todayRange(schedule: WorkDay[] | WorkSchedule | undefined | null) {
  const sch = normalize(schedule);
  const now = new Date();

  // If there's an exception for today, it overrides the weekly schedule.
  const ex = sch.exceptions.find((x) => x?.date === isoDate(now));
  if (ex) {
    return { open: ex.open || "", close: ex.close || "", isClosed: !!ex.isClosed, has: true };
  }

  const dk = dayKey(now.getDay());
  const today = sch.days.find((x) => x.day === dk);
  if (!today) return { open: "", close: "", isClosed: false, has: false };
  return { open: today.open || "", close: today.close || "", isClosed: !!today.isClosed, has: true };
}

export function openStatus(schedule: WorkDay[] | WorkSchedule | undefined | null) {
  const range = todayRange(schedule);
  const rangeText = range.open && range.close ? `${range.open}–${range.close}` : "";
  if (!range.has) return { isOpen: true, label: "Відкрито" as const, rangeText };
  if (range.isClosed) return { isOpen: false, label: "Зачинено" as const, rangeText };
  // Compare time strings HH:MM lexicographically
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const t = `${hh}:${mm}`;
  const isOpen = (!range.open || t >= range.open) && (!range.close || t <= range.close);
  return { isOpen, label: isOpen ? "Відкрито" : "Зачинено", rangeText };
}
