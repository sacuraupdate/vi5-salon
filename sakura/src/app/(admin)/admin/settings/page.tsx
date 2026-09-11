import { Settings } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';
import AccessDenied from '@/components/admin/AccessDenied';
import { ownerOnly } from '@/lib/admin-auth';

export default async function Page() {
  // メニューから隠すだけでは URL 直打ちを防げないため、サーバー側で必ず判定する
  const { allowed } = await ownerOnly();
  if (!allowed) return <AccessDenied what="設定" />;

  return (
    <ComingSoon
      icon={Settings}
      title="設定"
      description="サイト全体の設定を行います。"
      features={[
        { label: '基本情報', detail: 'サイト名・連絡先・法務ページの内容を設定します。' },
        { label: '講師の管理', detail: '講師の追加と、操作できる範囲の設定を行います。' },
        { label: '決済の設定', detail: '対応する通貨と決済方法を設定します。' },
        { label: 'メール送信', detail: '購入確認や修了通知の文面を設定します。' },
      ]}
    />
  );
}
