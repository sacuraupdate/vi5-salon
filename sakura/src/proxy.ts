import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import {
  ADMIN_DENIED_PATH,
  ADMIN_ROLE_COOKIE,
  canAccessRoute,
  isAdminDemoMode,
} from './lib/admin-permissions';
import { SITE_SESSION_COOKIE } from './lib/session';

const intl = createMiddleware(routing);

/** ログインしていない人に見せてはいけない購入者向けの領域 */
const PROTECTED_SEGMENTS = ['mypage', 'learn'] as const;

/** `/en/mypage/...` のようなパスから、保護対象かどうかとロケールを取り出す */
function protectedLocale(pathname: string): string | null {
  const [, locale, segment] = pathname.split('/');
  if (!locale || !segment) return null;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) return null;
  return PROTECTED_SEGMENTS.includes(segment as (typeof PROTECTED_SEGMENTS)[number]) ? locale : null;
}

/**
 * 管理画面・購入者向け画面へのアクセスは、ページの実装に関係なくここで必ず判定する。
 * ページ側のガードを書き忘れても素通りしない。
 *
 * ただしこれは1段目であって唯一の防御ではない。
 * 実際の受講権限はサーバーコンポーネント側でも必ず確認する（`src/lib/entitlement.ts`）。
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // 認証が未実装の間、本番では管理画面を動かさない（レイアウト側でも二重に止める）
    if (!isAdminDemoMode()) return NextResponse.next();

    // 拒否表示そのものは判定しない（無限ループ防止）
    if (pathname === ADMIN_DENIED_PATH) return NextResponse.next();

    const role = request.cookies.get(ADMIN_ROLE_COOKIE)?.value === 'instructor' ? 'instructor' : 'owner';
    if (!canAccessRoute(role, pathname)) {
      // URL は変えずに拒否画面を表示する
      return NextResponse.rewrite(new URL(ADMIN_DENIED_PATH, request.url));
    }
    return NextResponse.next();
  }

  // 購入者向け領域は、セッションが無ければその言語のログイン画面へ送る
  const locale = protectedLocale(pathname);
  if (locale && !request.cookies.get(SITE_SESSION_COOKIE)) {
    const url = new URL(`/${locale}/login`, request.url);
    // ログイン後に元のページへ戻せるようにしておく
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return intl(request);
}

export const config = {
  // 管理画面(/admin)は多言語化しない＝常に日本語。ただし権限判定のため matcher に含める。
  // それ以外は静的ファイルと API を除く全パスを通し、
  // ロケールの付いていない URL も next-intl がロケール付きへ寄せられるようにする
  // （寄せないと未知のURLが [locale] の外に落ち、404画面が翻訳されないため）。
  matcher: ['/admin', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
