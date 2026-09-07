import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CircleAlert,
  Clapperboard,
  Inbox,
  Megaphone,
  Sparkles,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { adminRepository } from '@/lib/data';
import { getAdminRole } from '@/lib/admin-session';
import { formatJpy } from '@/lib/format';
import KpiCard from '@/components/admin/KpiCard';
import SalesChart from '@/components/admin/SalesChart';
import { Badge, Card, EmptyState } from '@/components/ui/Card';

/** よく使う操作。管理TOPから2クリック以内で目的の画面へ届くようにする。 */
const ownerActions = [
  { href: '/admin/studio', label: '講座を作る', icon: Clapperboard },
  { href: '/admin/posts', label: '投稿する', icon: Megaphone },
  { href: '/admin/products', label: 'クーポンを作る', icon: Ticket },
  { href: '/admin/ai', label: 'AIに相談する', icon: Sparkles },
];

const instructorActions = [
  { href: '/admin/courses', label: '自分の講座を見る', icon: Clapperboard },
  { href: '/admin/posts', label: '投稿する', icon: Megaphone },
  { href: '/admin/inquiries', label: 'お問い合わせを見る', icon: Inbox },
  { href: '/admin/students', label: 'お客様を見る', icon: Users },
];

export default async function AdminDashboard() {
  const role = await getAdminRole();
  const isOwner = role === 'owner';

  const [summary, daily, courseSales, tasks, inquiries] = await Promise.all([
    adminRepository.getSalesSummary(role),
    adminRepository.listDailySales(),
    adminRepository.listCourseSales(role),
    adminRepository.listTasks(role),
    adminRepository.listInquiries(role),
  ]);

  const openInquiries = inquiries.filter((q) => q.status === 'open').length;
  const actions = isOwner ? ownerActions : instructorActions;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl">{isOwner ? 'ダッシュボード' : '今日の状況'}</h1>
        <p className="text-[13px] text-ink-muted">
          {isOwner
            ? '本日の売上・未対応・今日やることをここで確認できます。'
            : '自分の売上と、対応が必要なことだけを表示しています。'}
        </p>
      </header>

      {/* 上段：重要数値を4つ。開いてすぐ売上と未対応が分かる状態にする */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="本日の売上" value={formatJpy(summary.todayJpy)} />
        <KpiCard
          icon={TrendingUp}
          label="今月の売上"
          value={formatJpy(summary.monthJpy)}
          diffPercent={summary.monthDiffPercent}
        />
        <KpiCard icon={UserPlus} label="新規受講者（今月）" value={`${summary.newStudents}名`} />
        <KpiCard
          icon={CircleAlert}
          label="未対応"
          value={`${summary.openTaskCount}件`}
          sub={`お問い合わせ ${openInquiries}件を含む`}
          tone={summary.openTaskCount > 0 ? 'alert' : 'default'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* 今日やること */}
        <Card className="flex flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base">今日やること</h2>
            <Badge tone={tasks.length ? 'vermilion' : 'neutral'}>{tasks.length}件</Badge>
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              icon={<AlertCircle className="h-5 w-5" />}
              title="対応が必要なことはありません"
              body="新しいお問い合わせや翻訳の更新が発生すると、ここに表示されます。"
            />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${t.urgent ? 'bg-vermilion' : 'bg-sakura'}`}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[13px] leading-relaxed text-ink">{t.title}</span>
                    <span className="text-[11px] text-ink-muted">期限：{t.dueLabel}</span>
                  </span>
                  {t.urgent ? <Badge tone="sakura">急ぎ</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* クイック操作：よく使う操作へ2クリック以内で届くようにする */}
        <Card className="flex flex-col p-4 sm:p-5">
          <h2 className="mb-3 text-base">クイック操作</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col gap-2 rounded-sm border border-line p-3 transition-colors hover:border-vermilion hover:bg-washi"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-ink-2">
                  <a.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                </span>
                <span className="text-[13px] leading-snug">{a.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* 売上推移 */}
      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base">売上の推移</h2>
          <Link href="/admin/sales" className="inline-flex items-center gap-1 text-[13px] text-vermilion hover:underline">
            詳しく見る
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <SalesChart data={daily} />
      </Card>

      {/* 講座別の売上 */}
      <Card className="flex flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-vermilion" strokeWidth={1.5} />
          <h2 className="text-base">{isOwner ? '講座別の売上（今月）' : '自分の講座の売上（今月）'}</h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] text-ink-muted">
                <th className="pb-2 font-medium">講座</th>
                <th className="pb-2 font-medium">講師</th>
                <th className="pb-2 text-right font-medium">件数</th>
                <th className="pb-2 text-right font-medium">売上</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {courseSales.map((s) => (
                <tr key={s.courseSlug}>
                  <td className="py-2.5 pr-3 text-[13px]">{s.title.ja}</td>
                  <td className="py-2.5 pr-3 text-[11px] tracking-wider text-ink-muted uppercase">
                    {s.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}
                  </td>
                  <td className="py-2.5 text-right text-[13px]">{s.orders}</td>
                  <td className="py-2.5 text-right font-serif text-[13px]">{formatJpy(s.jpy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[11px] text-ink-muted">
        ※ Phase 1 のため、表示されている数値はすべて確認用のサンプルデータです。
      </p>
    </div>
  );
}
