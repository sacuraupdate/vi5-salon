import { Ticket } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';
import { getAdminRole } from '@/lib/admin-session';

export default async function Page() {
  // 講師も入れるページだが、扱える範囲が違う。何ができるかを役割ごとに書き分ける
  const role = await getAdminRole();

  if (role === 'instructor') {
    return (
      <ComingSoon
        icon={Ticket}
        title="クーポン"
        description="自分の講座に使えるクーポンを管理します。価格の設定はオーナーが行います。"
        features={[
          { label: '自分の講座のクーポン', detail: '自分が担当する講座だけを対象に、割引率と利用期限を指定して発行します。' },
          { label: '対象にできない範囲', detail: 'ほかの講師の講座・全商品対象・サイト全体のクーポンは作成できません。' },
          { label: '利用状況', detail: '自分が発行したクーポンがどれだけ使われたかを確認します。' },
          { label: '価格の設定', detail: '講座の価格と決済の設定はオーナーのみが変更できます。' },
        ]}
      />
    );
  }

  return (
    <ComingSoon
      icon={Ticket}
      title="商品・クーポン"
      description="講座の価格設定とクーポンを管理します。"
      features={[
        { label: '市場ごとの価格', detail: '為替換算ではなく、国ごとに独立した価格を設定します。' },
        { label: 'クーポンの発行', detail: '割引率・利用期限・対象講座を指定して発行します。サイト全体を対象にできます。' },
        { label: 'セット販売', detail: '複数の講座をまとめた商品を作成します。' },
        { label: '利用状況', detail: 'クーポンがどれだけ使われたかを確認します。' },
      ]}
    />
  );
}
