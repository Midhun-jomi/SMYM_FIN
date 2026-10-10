/**
 * Normalizes an incoming date string or timestamp into YYYY-MM-DD.
 * Converts UTC midnight offsets (e.g., 18:30 UTC = 00:00 IST) into the intended date.
 */
export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      // Format in IST (Asia/Kolkata) to get yyyy-mm-dd
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    }
    return dateStr.split('T')[0];
  }
  return dateStr.trim();
}

/**
 * Formats date into readable string (e.g., "12 Oct 2026")
 */
export function formatDate(dateStr: string): string {
  try {
    if (!dateStr) return '';
    const cleanStr = normalizeDateString(dateStr);
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns ISO string for today in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Checks if a date string is in the past
 */
export function isPastDate(dateStr: string): boolean {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
}
