import type { CurrencyCode, Locale, Localized, Price, TranslationMeta, TranslationStatus } from './data/types';

/** 多言語テキストの取り出し。翻訳が無い場合は日本語原本にフォールバックする。 */
export function t<T>(value: Localized<T>, locale: string): T {
  const key = locale as Exclude<Locale, 'ja'>;
  return (value[key] as T | undefined) ?? value.ja;
}

/** ロケールごとの既定通貨。価格は為替換算せず、市場ごとの設定値を使う。 */
const localeCurrency: Record<Locale, CurrencyCode> = {
  ja: 'JPY',
  en: 'USD',
  ko: 'KRW',
  'zh-TW': 'TWD',
};

export function formatPrice(price: Price, locale: string): string {
  const currency = localeCurrency[locale as Locale] ?? 'JPY';
  const amount = price[currency] ?? price.JPY;
  const used: CurrencyCode = price[currency] != null ? currency : 'JPY';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: used,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 管理画面は常に日本円で表示する（SAKURA が理解しやすいことを優先） */
export function formatJpy(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  );
}

/** 管理画面用の日付表記（日本語固定） */
export function formatDateJa(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  );
}

/**
 * 翻訳の鮮度を判定する。日本語原本が翻訳より新しければ「翻訳更新が必要」。
 * 管理画面のバッジ表示に使う。
 */
export function translationStatus(meta: TranslationMeta, locale: Exclude<Locale, 'ja'>): TranslationStatus {
  const target = meta.translations[locale];
  if (!target) return 'missing';
  return target.updatedAt < meta.masterUpdatedAt ? 'outdated' : 'translated';
}

export const translationStatusLabel: Record<TranslationStatus, string> = {
  translated: '翻訳済み',
  outdated: '翻訳更新が必要',
  missing: '未翻訳',
};

export const localeLabel: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어',
  'zh-TW': '繁體中文',
};

/** 管理画面に出す言語名は日本語で表記する */
export const localeLabelJa: Record<Locale, string> = {
  ja: '日本語',
  en: '英語',
  ko: '韓国語',
  'zh-TW': '繁体字中国語',
};
