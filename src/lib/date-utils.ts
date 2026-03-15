import { differenceInCalendarDays, format, formatDistanceToNow, isPast, isToday } from "date-fns";

export function daysBetween(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from);
}

export function daysFromNow(date: Date, referenceDate?: Date): number {
  const ref = referenceDate || new Date();
  return differenceInCalendarDays(date, ref);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatShortDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yy");
}

export function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return isPast(d) && !isToday(d);
}

export function daysOverdue(date: Date | string | null, referenceDate?: Date): number {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  const ref = referenceDate || new Date();
  const diff = differenceInCalendarDays(ref, d);
  return Math.max(0, diff);
}

export function weeksToBusinessDays(weeks: number): number {
  return weeks * 7;
}
