import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Locale, SiteSession } from './data/types';
import { MARKET_COOKIE, resolveMarket } from './market';
import { isAuthConfigured } from './env';
import { getAuthUser } from './auth';
import { getCommerce } from './commerce';

/** アクセストークン。期限が切れると Cookie ごと消える（maxAge を期限に合わせている） */
export const ACCESS_TOKEN_COOKIE = 'sjb_at';
/** リフレッシュトークン。アクセストークンを取り直すために使う */
export const REFRESH_TOKEN_COOKIE = 'sjb_rt';
/** 確認用セッション。Supabase Auth が未設定の開発環境でのみ使う */
export const DEMO_SESSION_COOKIE = 'sjb_session';

/** ログイン状態を表すすべての Cookie。ログアウト時にまとめて消す */
export const SESSION_COOKIES = [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, DEMO_SESSION_COOKIE] as const;

/**
 * 確認用のログイン状態を許すかどうか。
 *
 * **Supabase Auth が設定されている環境では、確認用セッションは一切使わない。**
 * 本物の認証が動いているのに抜け道を残さないため。
 * 設定前の開発・確認環境に限り、SITE_DEMO_MODE で画面を確認できるようにしている。
 */
export function isSiteDemoMode(): boolean {
  if (isAuthConfigured()) return false;
  const flag = process.env.SITE_DEMO_MODE;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

/** 確認用の仮アカウント。実データではない */
const DEMO_USER = { userId: 'demo-user', email: 'demo@example.com' } as const;

/**
 * 同じリクエスト内で何度呼ばれても、Supabase への問い合わせは1回にする。
 * レイアウトとページの両方から getSession() を呼ぶため。
 */
const verifyToken = cache(async (accessToken: string) => getAuthUser(accessToken));

/**
 * ログイン中の購入者を返す。未ログインなら null。
 *
 * 本人の特定は次の順で行う：
 *   1. Cookie のアクセストークンを Supabase に問い合わせて検証する
 *   2. 返ってきた auth.users.id で、アプリ側の購入者行を引く（無ければ作る）
 * **Cookie の中身や画面から渡された値を、そのまま本人とみなさない。**
 *
 * 認証が未設定の場合、本番では常に null（誰も入れない）。
 */
export async function getSession(): Promise<SiteSession | null> {
  const store = await cookies();
  const locale = (store.get('NEXT_LOCALE')?.value ?? 'en') as Locale;
  const market = resolveMarket(store.get(MARKET_COOKIE)?.value, locale);

  if (isAuthConfigured()) {
    const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return null;

    const authUser = await verifyToken(accessToken);
    if (!authUser) return null;

    const commerce = getCommerce();
    if (!commerce) return null;

    const user = await commerce.findOrCreateUserByAuthId({
      authUserId: authUser.id,
      email: authUser.email,
      locale,
      market,
    });
    return { userId: user.id, email: user.email, locale, market };
  }

  // ここから下は認証が未設定のときだけ。本番では isSiteDemoMode() が false になる
  if (!isSiteDemoMode()) return null;
  if (store.get(DEMO_SESSION_COOKIE)?.value !== 'demo') return null;
  return { ...DEMO_USER, locale, market };
}
