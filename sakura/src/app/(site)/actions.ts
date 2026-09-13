'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { MARKET_COOKIE, isMarketId } from '@/lib/market';
import { SITE_SESSION_COOKIE, isSiteDemoMode } from '@/lib/session';

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

/**
 * 確認用セッションの開始。
 * 本番（SITE_DEMO_MODE 未設定）では何もしない＝Cookie を書いても getSession() が null を返す。
 * 認証の代わりではない。Phase 2 でメール＋パスワードの検証に置き換える。
 */
export async function startDemoSession(formData: FormData) {
  if (!isSiteDemoMode()) return;
  const store = await cookies();
  store.set(SITE_SESSION_COOKIE, 'demo', { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
  const next = formData.get('next');
  redirect(typeof next === 'string' && next.startsWith('/') ? next : '/');
}
