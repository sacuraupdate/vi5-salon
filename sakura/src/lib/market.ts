import type { CurrencyCode, Locale, Localized, MarketId, MarketPrice, Pricing } from './data/types';

/**
 * 販売市場の定義。**言語（locale）とは独立**して管理する。
 *
 * 「英語＝アメリカ＝USD」という固定をしないため、価格は locale ではなく market から引く。
 * 英語を読むシンガポール・台湾・韓国のユーザーが、それぞれ別の市場を選べる。
 */
export type Market = {
  id: MarketId;
  currency: CurrencyCode;
  /** 顧客に見せる市場名 */
  label: Localized;
};

export const MARKETS: readonly Market[] = [
  {
    id: 'global-usd',
    currency: 'USD',
    label: { ja: '海外（米ドル）', en: 'International (USD)', ko: '해외 (USD)', 'zh-TW': '海外（美元）' },
  },
  {
    id: 'tw',
    currency: 'TWD',
    label: { ja: '台湾（台湾ドル）', en: 'Taiwan (TWD)', ko: '대만 (TWD)', 'zh-TW': '台灣（新台幣）' },
  },
  {
    id: 'kr',
    currency: 'KRW',
    label: { ja: '韓国（ウォン）', en: 'Korea (KRW)', ko: '한국 (KRW)', 'zh-TW': '韓國（韓元）' },
  },
  {
    id: 'jp',
    currency: 'JPY',
    label: { ja: '日本（円）', en: 'Japan (JPY)', ko: '일본 (JPY)', 'zh-TW': '日本（日圓）' },
  },
] as const;

export const MARKET_COOKIE = 'sjb_market';
export const DEFAULT_MARKET: MarketId = 'global-usd';

/**
 * 言語から市場の**初期値**だけを決める。以後は顧客の選択（Cookie）が優先される。
 * これは推測値であり、「言語＝市場」という固定ではない。
 */
const initialMarketByLocale: Record<Locale, MarketId> = {
  ja: 'jp',
  en: 'global-usd',
  ko: 'kr',
  'zh-TW': 'tw',
};

export function isMarketId(value: unknown): value is MarketId {
  return typeof value === 'string' && MARKETS.some((m) => m.id === value);
}

/** Cookie の選択があればそれを使い、無ければ言語から初期値を置く */
export function resolveMarket(cookieValue: string | undefined, locale: string): MarketId {
  if (isMarketId(cookieValue)) return cookieValue;
  return initialMarketByLocale[locale as Locale] ?? DEFAULT_MARKET;
}

export function marketOf(id: MarketId): Market {
  return MARKETS.find((m) => m.id === id) ?? MARKETS[0];
}

/** 顧客に見せる金額。**未設定の市場では null を返し、日本円へは落とさない。** */
export type ResolvedPrice = {
  currency: CurrencyCode;
  /** 実際に請求する金額 */
  amount: number;
  /** ローンチ価格が適用されている場合の通常価格（取り消し線用）。通常時は null */
  strikethrough: number | null;
  /**
   * 実際に請求する Stripe Price ID。未設定なら null。
   * **null のときは購入手続きに進めない。**金額だけでチェックアウトを作らない。
   */
  stripePriceId: string | null;
};

export function priceFor(pricing: Pricing, market: MarketId, today = new Date()): ResolvedPrice | null {
  // 価格未確定の講座は金額そのものを出さない
  if (pricing.status !== 'confirmed') return null;
  const entry: MarketPrice | undefined = pricing.byMarket[market];
  if (!entry) return null;

  const launchOpen =
    entry.launch != null &&
    (!pricing.launchEndsAt || pricing.launchEndsAt >= today.toISOString().slice(0, 10));

  const currency = marketOf(market).currency;
  return launchOpen
    ? {
        currency,
        amount: entry.launch as number,
        strikethrough: entry.list,
        stripePriceId: entry.launchPriceId ?? null,
      }
    : { currency, amount: entry.list, strikethrough: null, stripePriceId: entry.priceId ?? null };
}

/** その市場で販売しているか（価格が設定されているか） */
export function isSoldIn(pricing: Pricing, market: MarketId): boolean {
  return pricing.status === 'confirmed' && pricing.byMarket[market] != null;
}

/**
 * 実際に決済を開始できるか。
 * 価格が確定していても、Stripe の Price ID が未登録なら決済に進めない。
 */
export function isCheckoutReady(pricing: Pricing, market: MarketId): boolean {
  return priceFor(pricing, market)?.stripePriceId != null;
}

/** 金額の表示。通貨は市場から決まり、言語は書式だけに使う */
export function formatMoney(amount: number, currency: CurrencyCode, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
