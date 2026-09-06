import { Inbox } from 'lucide-react';
import { adminRepository } from '@/lib/data';
import { getAdminRole } from '@/lib/admin-session';
import { formatDateJa, localeLabelJa } from '@/lib/format';
import { Badge, Card, EmptyState } from '@/components/ui/Card';

export default async function InquiriesPage() {
  const role = await getAdminRole();
  const inquiries = await adminRepository.listInquiries(role);
  const open = inquiries.filter((q) => q.status === 'open');
  const answered = inquiries.filter((q) => q.status === 'answered');

  const list = (title: string, items: typeof inquiries, isOpen: boolean) => (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base">{title}</h2>
        <Badge tone={isOpen && items.length ? 'crimson' : 'neutral'}>{items.length}件</Badge>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="お問い合わせはありません"
          body="新しいお問い合わせが届くと、ここに表示されます。"
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {items.map((q) => (
              <li key={q.id} className="flex flex-col gap-2 p-4 hover:bg-surface sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-[14px] text-ink">{q.subject}</p>
                  <p className="text-[11px] text-ink-muted">
                    {q.name}（{q.country.ja}） ・ {formatDateJa(q.receivedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={q.language === 'ja' ? 'neutral' : 'sakura'}>{localeLabelJa[q.language]}</Badge>
                  <Badge tone={isOpen ? 'crimson' : 'outline'}>{isOpen ? '未対応' : '対応済み'}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl">お問い合わせ</h1>
        <p className="text-[13px] text-ink-muted">
          海外からのお問い合わせには、届いた言語を表示しています。
        </p>
      </header>
      {list('未対応', open, true)}
      {list('対応済み', answered, false)}
      <p className="text-[11px] text-ink-muted">※ Phase 1 のため、返信機能はまだ動作しません。</p>
    </div>
  );
}
