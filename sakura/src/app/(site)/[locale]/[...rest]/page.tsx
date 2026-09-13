import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import NotFoundView from '@/components/public/NotFoundView';

/**
 * どのルートにも一致しなかったURL。
 *
 * notFound() を投げずにここで直接描くのは、not-found 境界では
 * サーバー側の翻訳が引けず、内容がクライアント描画になってしまうため。
 * ここで描けば、低速回線でも最初のHTMLに正しい言語の案内が入る。
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  // 存在しないURLを検索結果に載せない
  robots: { index: false, follow: false },
};

export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const n = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <NotFoundView
      title={n('title')}
      body={n('body')}
      coursesLabel={n('courses')}
      homeLabel={n('home')}
    />
  );
}
