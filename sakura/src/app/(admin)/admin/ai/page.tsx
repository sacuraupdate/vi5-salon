import { Sparkles } from 'lucide-react';
import ComingSoon from '@/components/admin/ComingSoon';

export default function Page() {
  return (
    <ComingSoon
      icon={Sparkles}
      title="AI作業センター"
      description="ChatGPT と Claude Code を使った作業の入口をまとめます。"
      features={[
        { label: '講座企画の相談', detail: '講座の構成やレッスンの分け方を相談するための下書きを作ります。' },
        { label: '翻訳の下書き', detail: '日本語の原本から、各言語の下書きを作成します。' },
        { label: '商品説明の作成', detail: '講座紹介文や投稿文の案を作ります。' },
        { label: '売上の要約', detail: '数字の変化を日本語の文章にまとめます。' },
      ]}
    />
  );
}
