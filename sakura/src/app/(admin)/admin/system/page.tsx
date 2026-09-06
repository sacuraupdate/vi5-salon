import { Activity } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';

export default function Page() {
  return (
    <ComingSoon
      icon={Activity}
      title="システム状況"
      description="サイトが正常に動いているかを確認します。"
      features={[
        { label: '稼働状況', detail: 'サイト・決済・動画配信が正常かを表示します。' },
        { label: 'エラーの記録', detail: '発生した不具合を日本語で確認できます。' },
        { label: 'バックアップ', detail: 'データが保存された日時を確認します。' },
        { label: 'お知らせ', detail: 'システムの更新予定をお伝えします。' },
      ]}
    />
  );
}
