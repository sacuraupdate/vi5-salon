import { UserCog } from 'lucide-react';
import { setAdminRole } from '@/app/(admin)/admin/actions';
import type { AdminRole } from '@/lib/data';

/**
 * Phase 1 の確認用。SAKURA と TOMOMI で画面の違いを切り替えて確認するための仮UI。
 * Phase 2 で実際のログイン情報に置き換える。
 */
export default function RoleSwitcher({ role }: { role: AdminRole }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1.5 text-[11px] text-ink-muted sm:inline-flex">
        <UserCog className="h-3.5 w-3.5" />
        表示中の権限
      </span>
      <form action={setAdminRole} className="flex rounded-sm border border-line p-0.5">
        {(
          [
            ['owner', 'SAKURA'],
            ['instructor', 'TOMOMI'],
          ] as [AdminRole, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="submit"
            name="role"
            value={value}
            aria-pressed={role === value}
            className={`min-h-9 rounded-sm px-3 text-xs transition-colors ${
              role === value ? 'bg-vermilion text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </form>
    </div>
  );
}
