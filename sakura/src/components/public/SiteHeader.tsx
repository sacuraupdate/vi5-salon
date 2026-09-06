'use client';

import { Menu, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import Logo from '@/components/brand/Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { buttonClass } from '@/components/ui/Button';

export default function SiteHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/courses', label: t('courses') },
    { href: '/free', label: t('free') },
    { href: '/instructors/sakura', label: t('sakura') },
    { href: '/instructors/tomomi', label: t('tomomi') },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="SAKURA JAPAN BEAUTY">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-sm px-3 py-2 text-sm transition-colors ${
                isActive(l.href) ? 'text-crimson' : 'text-ink hover:text-crimson'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <div className="hidden sm:block">
            <Link href="/mypage" className={buttonClass('secondary')}>
              <User className="h-4 w-4" />
              {t('mypage')}
            </Link>
          </div>
          <div className="hidden sm:block">
            <Link href="/register" className={buttonClass('primary')}>
              {t('register')}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('menu')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* モバイル用ドロワー */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-0 right-0 flex h-dvh w-[86%] max-w-sm flex-col bg-bg shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('close')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-12 items-center rounded-sm px-3 text-[15px] ${
                    isActive(l.href) ? 'bg-sakura-soft text-crimson' : 'hover:bg-surface'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-3 border-t border-line pt-4">
                <p className="mb-2 px-3 text-xs text-ink-muted">{t('language')}</p>
                <LanguageSwitcher />
              </div>
            </nav>
            <div className="safe-bottom flex flex-col gap-2 border-t border-line p-4">
              <Link href="/mypage" onClick={() => setOpen(false)} className={buttonClass('secondary', 'lg')}>
                <User className="h-4 w-4" />
                {t('mypage')}
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className={buttonClass('primary', 'lg')}>
                {t('register')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
