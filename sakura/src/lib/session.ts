import { cookies } from 'next/headers';
import type { Locale, SiteSession } from './data/types';
import { MARKET_COOKIE, resolveMarket } from './market';

export const SITE_SESSION_COOKIE = 'sjb_session';

/**
 * 確認用のログイン状態を許すかどうか。
 *
 * 認証（メール＋パスワード）は未実装のため、**本番では常に未ログイン**として扱う。
 * 開発・確認環境だけ `SITE_DEMO_MODE=true` で仮ログインを許可し、画面を確認できるようにする。
 * 管理画面の ADMIN_DEMO_MODE と同じ考え方。**wrangler.jsonc には設定しないこと。**
 */
export function isSiteDemoMode(): boolean {
  const flag = process.env.SITE_DEMO_MODE;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

/** 確認用の仮アカウント。実データではない */
const DEMO_USER = { userId: 'demo-user', email: 'demo@example.com' } as const;

/**
 * ログイン中の購入者を返す。未ログインなら null。
 *
 * Phase 2 で Supabase のセッション検証に差し替える。
 * それまでは本番で常に null を返すため、購入者向け画面は誰も開けない。
 */
export async function getSession(): Promise<SiteSession | null> {
  if (!isSiteDemoMode()) return null;

  const store = await cookies();
  if (store.get(SITE_SESSION_COOKIE)?.value !== 'demo') return null;

  const locale = (store.get('NEXT_LOCALE')?.value ?? 'en') as Locale;
  return {
    ...DEMO_USER,
    locale,
    market: resolveMarket(store.get(MARKET_COOKIE)?.value, locale),
  };
}
