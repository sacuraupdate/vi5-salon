import { routing } from '@/i18n/routing';
import type { Locale } from './data/types';

/**
 * 公開URL。canonical / hreflang / OG の絶対URLに使う。
 * ドメイン確定後に NEXT_PUBLIC_SITE_URL を設定すれば、全ページが追従する。
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** OG 画像の言語コード（og:locale の書式） */
const ogLocale: Record<Locale, string> = {
  ja: 'ja_JP',
  en: 'en_US',
  ko: 'ko_KR',
  'zh-TW': 'zh_TW',
};

/**
 * 言語別の canonical と hreflang を作る。
 * path は言語プレフィックスを含まないパス（例: '/courses/japanese-salon-standard'）。
 */
export function alternatesFor(locale: string, path = '') {
  const clean = path === '/' ? '' : path;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${clean}`;
  }
  // 言語が特定できない流入は英語へ寄せる（海外向けが主対象のため）
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${clean}`;

  return {
    canonical: `${SITE_URL}/${locale}${clean}`,
    languages,
  };
}

export function openGraphLocale(locale: string): { locale: string; alternateLocale: string[] } {
  const current = ogLocale[locale as Locale] ?? ogLocale.en;
  return {
    locale: current,
    alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
  };
}
