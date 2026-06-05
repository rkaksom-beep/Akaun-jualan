/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatTarikh(tarikhStr: string): string {
  if (!tarikhStr) return '';
  const cleanStr = tarikhStr.split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  try {
    const dObj = new Date(tarikhStr);
    if (!isNaN(dObj.getTime())) {
      const day = String(dObj.getDate()).padStart(2, '0');
      const month = String(dObj.getMonth() + 1).padStart(2, '0');
      const year = dObj.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // ignore
  }
  return tarikhStr;
}

export function formatTarikhObj(dateObj: Date): string {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTarikhMelayu(tarikhStr: string): string {
  if (!tarikhStr) return '';
  const dateObj = new Date(tarikhStr + 'T12:00:00');
  return dateObj.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ms-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getLocalDateString(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}
