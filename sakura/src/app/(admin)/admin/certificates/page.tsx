import { Medal } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';
import AccessDenied from '@/components/admin/AccessDenied';
import { ownerOnly } from '@/lib/admin-auth';

export default async function Page() {
  // メニューから隠すだけでは URL 直打ちを防げないため、サーバー側で必ず判定する
  const { allowed } = await ownerOnly();
  if (!allowed) return <AccessDenied what="修了証・認定証の管理" />;

  return (
    <ComingSoon
      icon={Medal}
      title="修了証・認定証"
      description="発行した証明書の確認と、認定講座の発行基準の設定を行います。"
      features={[
        { label: '発行済み一覧', detail: 'Certificate ID・氏名・講座・発行日を確認できます。' },
        { label: '認定の審査', detail: '認定対象講座の合格判定と、認定証の発行を行います。' },
        { label: '証明ページ', detail: 'Web上で本人と講座を確認できるページを管理します。' },
        { label: 'デザインの設定', detail: '修了証と認定証それぞれのデザインを設定します。' },
      ]}
    />
  );
}
