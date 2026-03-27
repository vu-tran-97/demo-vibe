/**
 * Formatting utilities for the application.
 * Currency, date, number formatting functions.
 */

const LOCALE = 'vi-VN';
const CURRENCY_SYMBOL = '₫';

export function formatPrice(price: number): string {
  return price.toLocaleString(LOCALE) + CURRENCY_SYMBOL;
}

export function formatNumber(value: number): string {
  return value.toLocaleString(LOCALE);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString(LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
