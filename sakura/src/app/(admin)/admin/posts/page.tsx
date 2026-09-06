import { Megaphone } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';

export default function Page() {
  return (
    <ComingSoon
      icon={Megaphone}
      title="投稿・発信"
      description="お知らせやSNS向けの投稿をまとめて管理します。"
      features={[
        { label: 'お知らせの作成', detail: 'サイトに掲載するお知らせを作成します。' },
        { label: '公開予約', detail: '公開する日時を指定して予約できます。' },
        { label: '多言語の下書き', detail: '日本語で書いた内容をもとに、各言語の下書きを管理します。' },
        { label: '反応の確認', detail: '投稿ごとの閲覧数を確認します。' },
      ]}
    />
  );
}
