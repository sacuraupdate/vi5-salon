import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import {
  ADMIN_DENIED_PATH,
  ADMIN_ROLE_COOKIE,
  canAccessRoute,
  isAdminDemoMode,
} from './lib/admin-permissions';

const intl = createMiddleware(routing);

/**
 * 管理画面へのアクセスは、ページの実装に関係なくここで必ず判定する。
 * ページ側の ownerOnly() を書き忘れても、権限定義に無いURLは素通りしない。
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

  return intl(request);
}

export const config = {
  // 管理画面(/admin)は多言語化しない＝常に日本語。ただし権限判定のため matcher には含める。
  matcher: ['/', '/admin', '/admin/:path*', '/(ja|en|ko|zh-TW)/:path*'],
};
