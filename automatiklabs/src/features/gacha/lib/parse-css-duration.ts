/**
 * Parse a CSS duration value (e.g. "2500ms", "2.5s", "2s") into milliseconds.
 * Handles browser normalization where `2500ms` may be returned as `2.5s` by getComputedStyle.
 */
export function parseCssDuration(raw: string, fallbackMs: number): number {
  const trimmed = raw.trim();
  if (!trimmed) return fallbackMs;

  const value = parseFloat(trimmed);
  if (isNaN(value)) return fallbackMs;

  // If the value contains "ms", it's already in milliseconds
  if (trimmed.endsWith("ms")) return value;

  // If it contains "s" (but not "ms"), it's in seconds
  if (trimmed.endsWith("s")) return value * 1000;

  // No unit — assume milliseconds if > 10, otherwise seconds
  return value > 10 ? value : value * 1000;
}
