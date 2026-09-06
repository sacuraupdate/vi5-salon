import { Users } from 'lucide-react';
import { adminRepository } from '@/lib/data';
import { getAdminRole } from '@/lib/admin-session';
import { formatDateJa, localeLabelJa } from '@/lib/format';
import { Card, EmptyState, ProgressBar } from '@/components/ui/Card';

export default async function StudentsPage() {
  const role = await getAdminRole();
  const students = await adminRepository.listStudents(role);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl">{role === 'owner' ? '受講者' : 'お客様'}</h1>
        <p className="text-[13px] text-ink-muted">受講状況と、対応言語を確認できます。</p>
      </header>

      {students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="受講者がまだいません"
          body="講座が購入されると、ここに一覧が表示されます。"
        />
      ) : (
        <Card className="p-0">
          {/* 幅の狭い画面では表を横スクロールさせ、ページ全体は横に広げない */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] text-ink-muted">
                  <th className="px-4 py-3 font-medium">お名前</th>
                  <th className="px-4 py-3 font-medium">国・地域</th>
                  <th className="px-4 py-3 font-medium">言語</th>
                  <th className="px-4 py-3 font-medium">受講数</th>
                  <th className="px-4 py-3 font-medium">進捗</th>
                  <th className="px-4 py-3 font-medium">登録日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-surface">
                    <td className="px-4 py-3 text-[13px]">{s.name}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-muted">{s.country.ja}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-muted">{localeLabelJa[s.language]}</td>
                    <td className="px-4 py-3 text-[13px]">{s.courseCount}講座</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <ProgressBar value={s.progressPercent} className="w-20" />
                        <span className="text-[11px] text-ink-muted">{s.progressPercent}%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-ink-muted">{formatDateJa(s.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="text-[11px] text-ink-muted">※ Phase 1 のため、表示されている受講者は確認用のサンプルです。</p>
    </div>
  );
}
