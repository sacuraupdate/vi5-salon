'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { MARKET_COOKIE, isMarketId } from '@/lib/market';

/** 顧客が販売市場（＝通貨）を選ぶ。言語とは独立して保存する。 */
export async function setMarket(formData: FormData) {
  const value = formData.get('market');
  if (!isMarketId(value)) return;
  const store = await cookies();
  store.set(MARKET_COOKIE, value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}

