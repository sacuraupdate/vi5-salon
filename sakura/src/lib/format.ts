import { LOCALES } from './data/types';
import type {
  Chapter,
  Course,
  Locale,
  Localized,
  MarketId,
  TranslationMeta,
  TranslationStatus,
} from './data/types';
import { isSoldIn } from './market';

/**
 * 講座がその言語で顧客に公開されているか。
 * availability を持たない既存講座は従来どおり公開済みとして扱う。
 */
export function isPublishedIn(course: Pick<Course, 'availability'>, locale: string): boolean {
  if (!course.availability) return true;
  return course.availability[locale as Locale] === 'published';
}

/** 顧客に見せてよい言語だけを返す。availability が無ければ languages をそのまま使う。 */
export function publishedLocales(course: Pick<Course, 'availability' | 'languages'>): Locale[] {
  if (!course.availability) return course.languages;
  return LOCALES.filter((l) => course.availability?.[l] === 'published');
}

/** 章がその言語で公開済みか。章の指定が無ければ講座の公開状況に従う。 */
export function isChapterOpen(course: Course, chapter: Chapter, locale: string): boolean {
  if (chapter.status === 'in-production') return false;
  if (chapter.availability) return chapter.availability[locale as Locale] === 'published';
  return isPublishedIn(course, locale);
}

/**
 * 購入できるか。次の3つをすべて満たしたときだけ true。
 * 1. その言語で公開されている
 * 2. その市場に固定価格が設定されている（価格未確定なら false）
 * 3. 無料講座ではない
 * 仮価格のまま購入されることを構造的に防ぐ。
 */
export function isPurchasable(course: Course, locale: string, market: MarketId): boolean {
  if (course.isFree) return false;
  if (!isPublishedIn(course, locale)) return false;
  return isSoldIn(course.pricing, market);
}

/**
 * 【管理画面用】多言語テキストの取り出し。翻訳が無ければ日本語原本を返す。
 *
 * **顧客向け画面では使わないこと。** 海外の購入者に日本語が突然出る原因になる。
 * 顧客向けには tc / tcText / tcList を使う。
 */
export function t<T>(value: Localized<T>, locale: string): T {
  const key = locale as Exclude<Locale, 'ja'>;
  return (value[key] as T | undefined) ?? value.ja;
}

/**
 * 【顧客向け】多言語テキストの取り出し。
 * **翻訳が無い場合は日本語へ落とさず null を返す。** 呼び出し側が「準備中」を出す。
 */
export function tc<T>(value: Localized<T> | undefined, locale: string): T | null {
  if (!value) return null;
  if (locale === 'ja') return value.ja;
  return (value[locale as Exclude<Locale, 'ja'>] as T | undefined) ?? null;
}

/** 顧客向けの文字列。未翻訳なら渡された「準備中」の文言を返す。 */
export function tcText(value: Localized | undefined, locale: string, preparing: string): string {
  return tc(value, locale) ?? preparing;
}

/** 顧客向けの配列。未翻訳なら空配列（項目そのものを出さない）。 */
export function tcList(value: Localized<string[]> | undefined, locale: string): string[] {
  return tc(value, locale) ?? [];
}

/** 管理画面は常に日本円で表示する（SAKURA が理解しやすいことを優先） */
export function formatJpy(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 日付の表示。タイムゾーンを UTC に固定する。
 * 固定しないと、実行環境のタイムゾーンによって海外ユーザーに1日ずれた日付が出る。
 */
export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** 管理画面用の日付表記（日本語固定・日本時間） */
export function formatDateJa(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(`${iso}T00:00:00+09:00`));
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
