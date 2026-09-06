import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 管理画面(/admin)は多言語化しない＝常に日本語。matcher から除外する。
  matcher: ['/', '/(ja|en|ko|zh-TW)/:path*'],
};
