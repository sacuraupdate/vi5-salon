'use client';

import { useTranslations } from 'next-intl';
import NotFoundView from '@/components/public/NotFoundView';

/**
 * 404 の境界。
 *
 * この境界の中ではサーバー側の動的API（headers / getTranslations）が使えず、
 * 使うと中身が空のまま描画される。そのためクライアント側で翻訳を引いている。
 * 存在しないURL（いちばん多い経路）は [...rest]/page.tsx がサーバー側で描くので、
 * こちらは講座スラッグ違いなど、ページ内から notFound() を投げた場合の受け皿。
 */
export default function NotFound() {
  const n = useTranslations('notFound');
  return (
    <NotFoundView
      title={n('title')}
      body={n('body')}
      coursesLabel={n('courses')}
      homeLabel={n('home')}
    />
  );
}
