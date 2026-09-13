'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MARKETS, MARKET_COOKIE, isMarketId, resolveMarket } from '@/lib/market';
import { tc } from '@/lib/format';
import { setMarket } from '@/app/(site)/actions';

/**
 * 販売市場（＝通貨）の切り替え。言語切り替えとは別に置く。
 * 「英語＝USD」のような固定をしないため、顧客自身が市場を選べるようにする。
 *
 * クライアント側で Cookie を読むのは、フッターが全ページに入るため。
 * ここでサーバー側の cookies() を読むと、価格を出さないページまで動的になり表示が遅くなる。
 */
export default function MarketSwitcher() {
  const locale = useLocale();
  const t = useTranslations('market');
  const ref = useRef<HTMLSelectElement>(null);

  // 初期値は言語から置き、描画後に保存済みの選択があれば合わせる。
  // サーバー側で Cookie を読むと全ページが動的になるため、ここはクライアントで読む。
  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${MARKET_COOKIE}=`))
      ?.split('=')[1];
    if (isMarketId(saved) && ref.current) ref.current.value = saved;
  }, []);

  return (
    <form action={setMarket} className="flex flex-col gap-2">
      <label htmlFor="market" className="text-[10px] tracking-[0.3em] text-on-navy-muted uppercase">
        {t('label')}
      </label>
      <div className="flex items-center gap-2">
        <select
          id="market"
          name="market"
          ref={ref}
          defaultValue={resolveMarket(undefined, locale)}
          className="min-h-[44px] flex-1 border border-white/25 bg-transparent px-3 py-2 text-[13px] text-white"
        >
          {MARKETS.map((m) => (
            <option key={m.id} value={m.id} className="text-ink">
              {tc(m.label, locale) ?? m.currency}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-[44px] border border-white/25 px-3 text-[12px] whitespace-nowrap hover:border-sakura hover:text-sakura"
        >
          {t('change')}
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-on-navy-muted">{t('note')}</p>
    </form>
  );
}
