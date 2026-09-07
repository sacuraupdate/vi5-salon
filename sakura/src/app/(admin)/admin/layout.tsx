import type { Metadata } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import RoleSwitcher from '@/components/admin/RoleSwitcher';
import { getAdminRole } from '@/lib/admin-session';
import { roleLabel } from '@/lib/admin-nav';
import '../../globals.css';

export const metadata: Metadata = {
  title: '管理画面 | SAKURA JAPAN BEAUTY',
  description: 'SAKURA JAPAN BEAUTY の管理画面',
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // 管理画面は多言語化しない。lang は常に日本語で固定する。
  const role = await getAdminRole();

  return (
    <html lang="ja">
      <body className="bg-washi text-ink">
        <div className="flex min-h-dvh">
          <AdminSidebarWrapper role={role} />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg px-4">
              <div className="flex items-center gap-3 lg:hidden">
                <AdminSidebar role={role} />
              </div>
              <p className="hidden text-sm text-ink-muted lg:block">{roleLabel[role]} として表示しています</p>
              <RoleSwitcher role={role} />
            </header>
            <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

/** デスクトップ用の固定サイドバー（モバイルではヘッダー側のボタンを使う） */
function AdminSidebarWrapper({ role }: { role: 'owner' | 'instructor' }) {
  return (
    <div className="hidden lg:block">
      <AdminSidebar role={role} />
    </div>
  );
}
