import { Activity, CheckCircle2, Circle, Construction, Link2 } from 'lucide-react';
import AccessDenied from '@/components/admin/AccessDenied';
import { ownerOnly } from '@/lib/admin-auth';
import { integrationStatuses } from '@/lib/env';
import { catalogRepository } from '@/lib/data';
import { MARKETS } from '@/lib/market';
import { formatJpy } from '@/lib/format';
import { CONSENT_TEXT_APPROVED, CONSENT_VERSION } from '@/lib/consent';
import { SITE_URL } from '@/lib/site';
import { Card } from '@/components/ui/Card';

/** 接続状況を実行時に読むため、静的生成しない */
export const dynamic = 'force-dynamic';

export default async function Page() {
  // メニューから隠すだけでは URL 直打ちを防げないため、サーバー側で必ず判定する
  const { allowed } = await ownerOnly();
  if (!allowed) return <AccessDenied what="システム状況" />;

  const statuses = integrationStatuses();
  const missing = statuses.filter((s) => !s.ready);

  // 販売の準備状況。金額と Stripe の価格IDが揃っている市場だけが購入できる
  const courses = await catalogRepository.listCourses({ includeUnlisted: false });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
          <Activity className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl">システム状況</h1>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            外部サービスとの接続状況です。設定の手順は <code className="font-mono">docs/env-setup.md</code> にあります。
          </p>
        </div>
      </header>

      {missing.length > 0 ? (
        <Card className="flex items-start gap-3 border-vermilion/40 bg-vermilion/5 p-4">
          <Construction className="mt-0.5 h-5 w-5 shrink-0 text-vermilion" strokeWidth={1.5} />
          <div className="text-[13px] leading-relaxed text-ink">
            <p className="font-medium">まだ販売を開始できません（未設定が {missing.length} 件）</p>
            <p className="mt-1 text-ink-muted">
              下の「未設定」の項目を設定すると、購入・受講・メール送信が動きはじめます。
            </p>
          </div>
        </Card>
      ) : (
        <Card className="flex items-start gap-3 border-pine/40 bg-pine/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pine" strokeWidth={1.5} />
          <p className="text-[13px] leading-relaxed text-ink">
            外部サービスの接続はすべて設定済みです。
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {statuses.map((s) => (
          <Card key={s.key} className="flex flex-col gap-1.5 p-4">
            <div className="flex items-center gap-2.5">
              {s.ready ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-pine" strokeWidth={1.5} />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
              )}
              <span className="text-[14px] font-medium">{s.label}</span>
              <span className={`text-[12px] ${s.ready ? 'text-pine' : 'text-vermilion'}`}>
                {s.ready ? '設定済み' : '未設定'}
              </span>
            </div>
            {s.ready ? null : <p className="pl-6.5 text-[12px] leading-relaxed text-ink-muted">{s.todo}</p>}
          </Card>
        ))}
      </div>

      {/* 販売の準備状況。何が足りないかを市場ごとに日本語で出す */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm text-ink-muted">販売の準備状況（手順は docs/stripe-setup.md）</h2>
        {courses.map((course) => (
          <Card key={course.slug} className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-medium">{course.title.ja}</h3>
              <span className={`text-[12px] ${course.pricing.status === 'confirmed' ? 'text-pine' : 'text-vermilion'}`}>
                {course.pricing.status === 'confirmed' ? '価格 確定済み' : '価格 未確定（購入できません）'}
              </span>
            </div>

            <ul className="flex flex-col divide-y divide-line border-t border-line">
              {MARKETS.map((market) => {
                const entry = course.pricing.byMarket[market.id];
                const hasListId = Boolean(entry?.priceId);
                const needsLaunchId = entry?.launch != null;
                const hasLaunchId = Boolean(entry?.launchPriceId);
                const ready = Boolean(entry) && hasListId && (!needsLaunchId || hasLaunchId);

                const missingParts: string[] = [];
                if (!entry) missingParts.push('金額が未設定');
                else {
                  if (!hasListId) missingParts.push('通常価格の価格IDが未登録');
                  if (needsLaunchId && !hasLaunchId) missingParts.push('ローンチ価格の価格IDが未登録');
                }

                return (
                  <li key={market.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    {ready ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-pine" strokeWidth={1.5} />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-vermilion" strokeWidth={1.5} />
                    )}
                    <span className="min-w-24 text-[13px]">{market.label.ja}</span>
                    <span className="text-[12px] text-ink-muted">
                      {entry
                        ? `${market.currency} ${entry.launch ?? entry.list}${entry.launch != null ? `（通常 ${entry.list}）` : ''}`
                        : '—'}
                    </span>
                    {ready ? null : (
                      <span className="text-[12px] text-vermilion">{missingParts.join(' / ')}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="text-[12px] text-ink-muted">
              日本円での目安：
              {course.pricing.byMarket.jp
                ? formatJpy(course.pricing.byMarket.jp.launch ?? course.pricing.byMarket.jp.list)
                : '未設定'}
            </p>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-2 p-4">
        <h2 className="text-[14px] font-medium">その他の確認</h2>
        <dl className="flex flex-col gap-1.5 text-[12px] text-ink-muted">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              公開URL
            </dt>
            <dd className="font-mono break-all text-ink-2">{SITE_URL}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt>購入時の同意文言</dt>
            <dd className={CONSENT_TEXT_APPROVED ? 'text-pine' : 'text-vermilion'}>
              {CONSENT_TEXT_APPROVED ? `確定済み（版 ${CONSENT_VERSION}）` : `未確定（版 ${CONSENT_VERSION}・専門家の確認待ち）`}
            </dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt>Webhook の受け取り先</dt>
            <dd className="font-mono break-all text-ink-2">{SITE_URL}/api/stripe/webhook</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
