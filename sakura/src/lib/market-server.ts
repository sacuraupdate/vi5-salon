import { cookies } from 'next/headers';
import type { MarketId } from './data/types';
import { MARKET_COOKIE, resolveMarket } from './market';

/**
 * 表示・購入に使う市場を決める。
 * 顧客が選んでいればその選択、無ければ言語から初期値を置く。
 *
 * この関数を呼ぶページは動的レンダリングになる。価格の通貨を取り違えないことを優先する。
 */
export async function getMarket(locale: string): Promise<MarketId> {
  const store = await cookies();
  return resolveMarket(store.get(MARKET_COOKIE)?.value, locale);
}
