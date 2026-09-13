import { defineRouting } from 'next-intl/routing';
import { LOCALES } from '@/lib/data/types';

export const routing = defineRouting({
  locales: LOCALES,
  // 海外向けが主対象のため、ロケールが特定できない場合は英語に寄せる。
  // 日本語は /ja で引き続き利用でき、コンテンツの原本(MASTER)は日本語のまま。
  defaultLocale: 'en',
  // 4言語すべてで URL 形状を揃える（既定言語だけ形が変わる分岐を作らない）
  localePrefix: 'always',
});
