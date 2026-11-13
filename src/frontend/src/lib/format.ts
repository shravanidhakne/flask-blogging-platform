import { format, formatDistanceToNowStrict } from "date-fns";

/**
 * Convert a Motoko `Time.now()` nanosecond bigint into a JavaScript `Date`.
 * Returns `null` for values that cannot form a valid date so callers can
 * render a fallback instead of "Invalid Date".
 */
export function timestampToDate(
  timestamp: bigint | undefined | null,
): Date | null {
  if (timestamp === undefined || timestamp === null) return null;
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Short editorial date, e.g. "Oct 24". */
export function formatPostDate(timestamp: bigint | undefined | null): string {
  const date = timestampToDate(timestamp);
  return date ? format(date, "MMM d") : "—";
}

/** Full date with year, e.g. "October 24, 2026". */
export function formatFullDate(timestamp: bigint | undefined | null): string {
  const date = timestampToDate(timestamp);
  return date ? format(date, "MMMM d, yyyy") : "—";
}

/** Relative time, e.g. "3 days ago". */
export function formatRelativeDate(
  timestamp: bigint | undefined | null,
): string {
  const date = timestampToDate(timestamp);
  return date ? `${formatDistanceToNowStrict(date)} ago` : "—";
}

/** True when a post has been edited after it was created. */
export function wasEdited(post: {
  createdAt: bigint;
  updatedAt: bigint;
}): boolean {
  return post.updatedAt > post.createdAt;
}
