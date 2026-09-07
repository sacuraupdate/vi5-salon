'use client';

import { Check, Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { localeLabel } from '@/lib/format';
import type { Locale } from '@/lib/data/types';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const change = (next: string) => {
    setOpen(false);
    router.replace(pathname, { locale: next as Locale });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line px-3 text-sm text-ink hover:border-vermilion hover:text-vermilion"
      >
        <Globe className="h-4 w-4" />
        <span className={compact ? 'sr-only' : ''}>{localeLabel[locale as Locale]}</span>
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-line bg-bg shadow-lift"
          >
            {routing.locales.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l === locale}
                  onClick={() => change(l)}
                  className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm hover:bg-washi"
                >
                  {localeLabel[l]}
                  {l === locale ? <Check className="h-4 w-4 text-vermilion" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
