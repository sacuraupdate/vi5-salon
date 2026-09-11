import AccessDenied from '@/components/admin/AccessDenied';

/**
 * 権限が足りないときに proxy から表示される画面。
 * URL は元のまま（rewrite）なので、どのページを開こうとしたかは変わらない。
 */
export default function Page() {
  return <AccessDenied what="開こうとしたページ" />;
}
