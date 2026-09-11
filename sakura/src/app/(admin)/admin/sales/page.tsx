import { BarChart3, Globe2, Wallet } from 'lucide-react';
import { adminRepository } from '@/lib/data';
import { getAdminRole } from '@/lib/admin-session';
import { formatJpy } from '@/lib/format';
import KpiCard from '@/components/admin/KpiCard';
import SalesChart from '@/components/admin/SalesChart';
import { Card } from '@/components/ui/Card';

export default async function SalesPage() {
  const role = await getAdminRole();
  const isOwner = role === 'owner';

  const [summary, daily, courseSales, countrySales] = await Promise.all([
    adminRepository.getSalesSummary(role),
    adminRepository.listDailySales(role),
    adminRepository.listCourseSales(role),
    adminRepository.listCountrySales(role),
  ]);

  const total = courseSales.reduce((n, s) => n + s.jpy, 0);
  const orders = courseSales.reduce((n, s) => n + s.orders, 0);
  const maxCountry = Math.max(...countrySales.map((c) => c.jpy));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl">{isOwner ? '売上・分析' : '自分の売上'}</h1>
        <p className="text-[13px] text-ink-muted">金額はすべて日本円で表示しています。</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="今月の売上" value={formatJpy(summary.monthJpy)} diffPercent={summary.monthDiffPercent} />
        <KpiCard icon={BarChart3} label="今月の販売件数" value={`${orders}件`} />
        <KpiCard icon={Wallet} label="講座別売上の合計" value={formatJpy(total)} />
        <KpiCard icon={Globe2} label="購入のあった国" value={`${countrySales.length}か国`} />
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="text-base">日ごとの売上</h2>
        <SalesChart data={daily} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4 sm:p-5">
          <h2 className="mb-3 text-base">講座別</h2>
          <ul className="flex flex-col divide-y divide-line">
            {courseSales.map((s) => {
              const pct = Math.round((s.jpy / total) * 100);
              return (
                <li key={s.courseSlug} className="flex flex-col gap-1.5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px]">{s.title.ja}</span>
                    <span className="shrink-0 font-serif text-[13px]">{formatJpy(s.jpy)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-sm bg-line">
                      <span className="block h-full rounded-sm bg-vermilion" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-16 text-right text-[11px] text-ink-muted">{s.orders}件 / {pct}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="flex flex-col p-4 sm:p-5">
          <h2 className="mb-3 text-base">国別</h2>
          <ul className="flex flex-col divide-y divide-line">
            {countrySales.map((c) => (
              <li key={c.country.ja} className="flex flex-col gap-1.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px]">{c.country.ja}</span>
                  <span className="shrink-0 font-serif text-[13px]">{formatJpy(c.jpy)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-sm bg-line">
                    <span
                      className="block h-full rounded-sm bg-sakura"
                      style={{ width: `${Math.round((c.jpy / maxCountry) * 100)}%` }}
                    />
                  </span>
                  <span className="w-12 text-right text-[11px] text-ink-muted">{c.orders}件</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="text-[11px] text-ink-muted">※ Phase 1 のため、表示されている数値はすべて確認用のサンプルデータです。</p>
    </div>
  );
}
