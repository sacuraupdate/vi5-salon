'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonClass } from '@/components/ui/Button';

/**
 * 想定外のエラー画面。Next.js の既定画面（英語・開発者向け）を顧客に見せない。
 * 「何が起きたか」「次に何をすればいいか」を顧客の言語で書く。
 */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // 原因追跡用。顧客には出さない
    console.error(error);
  }, [error]);

  const e = useTranslations('errorPage');

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-vermilion" strokeWidth={1.25} />
      <h1 className="font-serif text-[22px] leading-relaxed text-ink">{e('title')}</h1>
      <p className="text-sm leading-loose text-ink-muted">{e('body')}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClass('primary')}>
          {e('retry')}
        </button>
        <Link href="/" className={buttonClass('secondary')}>
          {e('home')}
        </Link>
        <Link href="/contact" className="text-[13px] text-vermilion hover:underline">
          {e('contact')}
        </Link>
      </div>
      {error.digest ? <p className="font-mono text-[10px] text-ink-muted">{error.digest}</p> : null}
    </div>
  );
}
