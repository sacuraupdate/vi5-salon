import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';

/**
 * 権限が足りないときの画面。
 * エラーコードだけで終わらせず、何が起きたか・どうすればいいかを日本語で書く。
 */
export default function AccessDenied({ what }: { what: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-vermilion/40 text-vermilion">
          <ShieldAlert className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl">このページは開けません</h1>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            {what}は、オーナー（SAKURA）だけが使えるページです。
          </p>
        </div>
      </header>

      <Card className="flex flex-col gap-3 p-5">
        <p className="text-[13px] leading-relaxed text-ink-2">
          いまは講師の権限で表示しています。この画面はサイト全体の設定や、ほかの講師の情報を扱うため、
          講師の権限では開けないようにしています。
        </p>
        <p className="text-[13px] leading-relaxed text-ink-2">
          必要な場合は、オーナーに操作を依頼してください。
        </p>
        <div className="mt-1">
          <Link href="/admin" className={buttonClass('secondary')}>
            ダッシュボードへ戻る
          </Link>
        </div>
      </Card>
    </div>
  );
}
