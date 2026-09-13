import type { MetadataRoute } from 'next';
import { isSiteIndexable } from '@/lib/env';

/** 設定を実行時に読むため、静的生成しない */
export const dynamic = 'force-dynamic';

/**
 * 検索エンジン向けの指示。
 *
 * 販売開始前は**サイト全体を検索対象から外す**（既定）。
 * 未完成の状態で検索結果に載ると、あとから印象を直しにくいため。
 * 直接URLを開く分には何の影響もない（Stripe の審査はこちら）。
 *
 * 販売開始日に SITE_INDEXABLE=true を設定すると、公開ページだけが対象になる。
 */
export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexable()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 購入者専用・管理・決済の画面は、公開後も検索対象にしない
        disallow: ['/admin', '/api/', '/*/mypage', '/*/learn', '/*/checkout', '/*/legal'],
      },
    ],
  };
}
