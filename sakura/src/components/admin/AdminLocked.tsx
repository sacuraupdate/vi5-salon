import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * 認証が未実装の間、本番で管理画面を開かせないための画面。
 * 環境変数 ADMIN_DEMO_MODE=true のときだけ管理画面が動く。
 */
export default function AdminLocked() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex w-full max-w-xl flex-col gap-5">
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
            <Lock className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl">管理画面は現在ご利用いただけません</h1>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              ログイン機能の準備が終わるまで、この環境では管理画面を開けないようにしています。
            </p>
          </div>
        </header>

        <Card className="flex flex-col gap-3 p-5">
          <p className="text-[13px] leading-relaxed text-ink-2">
            いまの管理画面は開発中の確認用で、ログインの仕組みがまだありません。
            そのまま公開すると誰でも開けてしまうため、確認用の環境でのみ動くようにしています。
          </p>
          <p className="text-[13px] leading-relaxed text-ink-2">
            確認用の環境で開きたい場合は、その環境の設定に
            <code className="mx-1 rounded-sm bg-washi px-1.5 py-0.5 font-mono text-[12px]">ADMIN_DEMO_MODE=true</code>
            を追加してください。本番ではこの設定を入れないでください。
          </p>
        </Card>
      </div>
    </div>
  );
}
