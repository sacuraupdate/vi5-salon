'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/brand/Logo';
import { navFor } from '@/lib/admin-nav';
import type { AdminRole } from '@/lib/data';

export default function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navFor(role);

  const active = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  const list = (
    <ul className="flex flex-col gap-0.5 p-3">
      {items.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            onClick={() => setOpen(false)}
            className={`flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-[13px] transition-colors ${
              active(i.href)
                ? 'border-l-2 border-crimson bg-washi pl-2.5 font-medium text-crimson'
                : 'border-l-2 border-transparent text-ink-2 hover:bg-washi'
            }`}
          >
            <i.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.5} />
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* デスクトップ：常時表示 */}
      <aside className="hidden w-56 shrink-0 border-r border-line bg-bg lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-16 items-center border-b border-line px-4">
            <Link href="/admin">
              <Logo />
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto">{list}</nav>
          <p className="border-t border-line px-4 py-3 text-[10px] leading-relaxed text-ink-muted">
            管理画面はすべて日本語で表示されます
          </p>
        </div>
      </aside>

      {/* モバイル：ドロワー */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-0 left-0 flex h-dvh w-72 flex-col bg-bg shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="メニューを閉じる"
                className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">{list}</nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
