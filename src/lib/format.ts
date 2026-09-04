import { formatDistanceToNow, parseISO } from "date-fns";
import { enAU } from "date-fns/locale";

const TZ = "Australia/Sydney";

export function money(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function moneyExact(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function gstOf(exGst: number): number {
  return Math.round(exGst * 0.1 * 100) / 100;
}

export function incGst(exGst: number): number {
  return Math.round((exGst + gstOf(exGst)) * 100) / 100;
}

export function lineSell(qty: number, unitSell: number): number {
  return Math.round(qty * unitSell * 100) / 100;
}

function asDate(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T09:00:00+10:00`);
  return parseISO(iso);
}

export function dt(iso: string, pattern = "EEE d MMM, h:mm a"): string {
  try {
    const d = asDate(iso);
    const hasTime = /h|a|H/.test(pattern) || /mm/.test(pattern);
    const hasYear = /y/.test(pattern);
    const hasWeekday = /E/.test(pattern);
    const hasDay = /d/.test(pattern);
    const hasMonth = /M/.test(pattern);
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ,
      weekday: hasWeekday ? (pattern.includes("EEEE") ? "long" : "short") : undefined,
      day: hasDay ? "numeric" : undefined,
      month: hasMonth ? "short" : undefined,
      year: hasYear ? "numeric" : undefined,
      hour: hasTime ? "numeric" : undefined,
      minute: hasTime ? "2-digit" : undefined,
      hour12: hasTime ? true : undefined,
    }).format(d);
  } catch {
    return iso;
  }
}

export function timeOf(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(asDate(iso));
  } catch {
    return iso;
  }
}

export function dayOf(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ,
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(asDate(iso));
  } catch {
    return iso;
  }
}

export function relative(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: enAU });
  } catch {
    return iso;
  }
}

export function greetingSydney(): "Morning" | "Afternoon" | "Evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", {
      hour: "numeric",
      hour12: false,
      timeZone: TZ,
    }).format(new Date()),
  );
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Add minutes to a wall-clock ISO (`…T07:30:00+10:00`) without shifting the timezone suffix. */
export function addMinsIso(iso: string, mins: number): string {
  const m = /^(.*)T(\d{2}):(\d{2})(.*)$/.exec(iso);
  if (!m) return iso;
  const total = Number(m[2]) * 60 + Number(m[3]) + mins;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${m[1]}T${hh}:${mm}${m[4]}`;
}

export function todaySydneyISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function todaySydneyLabel(): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());
}
