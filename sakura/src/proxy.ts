import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import {
  ADMIN_DENIED_PATH,
  ADMIN_ROLE_COOKIE,
  canAccessRoute,
  isAdminDemoMode,
} from './lib/admin-permissions';
import {
  ACCESS_TOKEN_COOKIE,
  DEMO_SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './lib/session';
import { isAuthConfigured } from './lib/env';
import { refresh } from './lib/auth';

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

/** ログイン後に元のページへ戻せるようにした、ログイン画面のURL */
function loginUrl(request: NextRequest, locale: string, pathname: string): URL {
  const url = new URL(`/${locale}/login`, request.url);
  url.searchParams.set('next', pathname);
  return url;
}

/**
 * 管理画面・購入者向け画面へのアクセスは、ページの実装に関係なくここで必ず判定する。
 * ページ側のガードを書き忘れても素通りしない。
 *
 * ただしこれは1段目であって唯一の防御ではない。
 * 実際の受講権限はサーバーコンポーネント側でも必ず確認する（`src/lib/entitlement.ts`）。
 */
export default async function proxy(request: NextRequest) {
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

  // 購入者向け領域の1段目の判定
  const locale = protectedLocale(pathname);
  if (locale) {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const demo = request.cookies.get(DEMO_SESSION_COOKIE)?.value;

    // アクセストークンの期限が切れている（Cookie が消えている）が、
    // リフレッシュトークンは残っている場合。取り直して同じURLへ送り直す。
    // Cookie は次のリクエストから読めるようになるため、ここでリダイレクトが要る。
    if (!accessToken && refreshToken && isAuthConfigured()) {
      const renewed = await refresh(refreshToken);
      const response = NextResponse.redirect(request.url);
      const base = {
        path: '/',
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
      };
      if (renewed) {
        response.cookies.set(ACCESS_TOKEN_COOKIE, renewed.accessToken, {
          ...base,
          maxAge: renewed.expiresIn,
        });
        response.cookies.set(REFRESH_TOKEN_COOKIE, renewed.refreshToken, {
          ...base,
          maxAge: 60 * 60 * 24 * 30,
        });
        return response;
      }
      // 取り直せなかった＝もう有効ではない。残骸を消してログインへ送る
      const login = NextResponse.redirect(loginUrl(request, locale, pathname));
      login.cookies.delete(REFRESH_TOKEN_COOKIE);
      return login;
    }

    const signedIn = Boolean(accessToken) || (!isAuthConfigured() && demo === 'demo');
    if (!signedIn) return NextResponse.redirect(loginUrl(request, locale, pathname));
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
