import { defineRouting } from 'next-intl/routing';
import { LOCALES } from '@/lib/data/types';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'ja',
  // 4言語すべてで URL 形状を揃える（既定言語だけ形が変わる分岐を作らない）
  localePrefix: 'always',
});
