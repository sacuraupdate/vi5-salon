import { Ticket } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';

export default function Page() {
  return (
    <ComingSoon
      icon={Ticket}
      title="商品・クーポン"
      description="講座の価格設定とクーポンを管理します。"
      features={[
        { label: '市場ごとの価格', detail: '為替換算ではなく、国ごとに独立した価格を設定します。' },
        { label: 'クーポンの発行', detail: '割引率・利用期限・対象講座を指定して発行します。' },
        { label: 'セット販売', detail: '複数の講座をまとめた商品を作成します。' },
        { label: '利用状況', detail: 'クーポンがどれだけ使われたかを確認します。' },
      ]}
    />
  );
}
