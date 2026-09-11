import { Clapperboard } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';
import AccessDenied from '@/components/admin/AccessDenied';
import { ownerOnly } from '@/lib/admin-auth';

export default async function Page() {
  // メニューから隠すだけでは URL 直打ちを防げないため、サーバー側で必ず判定する
  const { allowed } = await ownerOnly();
  if (!allowed) return <AccessDenied what="講座制作" />;

  return (
    <ComingSoon
      icon={Clapperboard}
      title="講座制作"
      description="動画・教材・確認テストを登録し、講座として公開するまでをここで行います。"
      features={[
        { label: 'レッスンの登録', detail: '動画と字幕をレッスン単位で登録します。1レッスンは6〜12分を想定しています。' },
        { label: '教材のアップロード', detail: '講義PDF・Workbook・チェックリスト・文字起こしを登録します。' },
        { label: '確認テストの作成', detail: '修了・認定の判定に使う問題を作成します。' },
        { label: '翻訳の管理', detail: '日本語の原本を更新したとき、どの言語の翻訳が古いかを確認できます。' },
      ]}
    />
  );
}
