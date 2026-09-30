/**
 * Formats an amount in paise to Indian Rupee (INR) representation.
 * Example: 249900 paise -> "₹2,499"
 * Example: 0 paise -> "Free"
 * Example: null/undefined/NaN -> "—"
 */
export function formatINR(paise: number | null | undefined, options?: { showFreeForZero?: boolean }): string {
  const { showFreeForZero = true } = options || {};
  if (paise === null || paise === undefined || isNaN(Number(paise))) {
    return '—';
  }
  const numericPaise = Number(paise);
  if (showFreeForZero && numericPaise === 0) {
    return 'Free';
  }
  const rupees = Math.round(numericPaise / 100);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Converts rupee string/number input to integer paise.
 */
export function toPaise(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

/**
 * Formats line count into compact human format.
 * Example: 14200 -> "14.2k", 850 -> "850", 1200000 -> "1.2M"
 */
export function formatLOC(loc: number | null | undefined): string {
  if (loc === null || loc === undefined || isNaN(Number(loc))) return '—';
  const n = Number(loc);
  if (n < 1000) return `${n}`;
  if (n < 1000000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  const m = n / 1000000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}

/**
 * Formats time elapsed since project was abandoned into compact notation.
 * Example: "2024-03-15" (1.5 years ago) -> "1y 6m"
 * Example: "2025-10-01" (5 months ago) -> "5m"
 */
export function formatDeadFor(abandonedOn: string | null | undefined): string | null {
  if (!abandonedOn) return null;
  const abandoned = new Date(abandonedOn);
  if (isNaN(abandoned.getTime())) return null;

  const now = new Date();
  if (abandoned > now) return 'Recently';

  let years = now.getFullYear() - abandoned.getFullYear();
  let months = now.getMonth() - abandoned.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0 && months > 0) {
    return `${years}y ${months}m`;
  }
  if (years > 0) {
    return `${years}y`;
  }
  if (months > 0) {
    return `${months}m`;
  }

  // Less than 1 month
  const diffDays = Math.floor((now.getTime() - abandoned.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays}d`;
  return '< 1m';
}
