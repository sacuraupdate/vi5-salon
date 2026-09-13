import { SearchX } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { buttonClass } from '@/components/ui/Button';

/**
 * 404 の中身。文言を props で受け取るため、
 * サーバー側（catch-all ページ）からもクライアント側（not-found 境界）からも使える。
 */
export default function NotFoundView({
  title,
  body,
  coursesLabel,
  homeLabel,
}: {
  title: string;
  body: string;
  coursesLabel: string;
  homeLabel: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <SearchX className="h-8 w-8 text-ink-muted" strokeWidth={1.25} />
      <h1 className="font-serif text-[22px] leading-relaxed text-ink">{title}</h1>
      <p className="text-sm leading-loose text-ink-muted">{body}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/courses" className={buttonClass('primary')}>
          {coursesLabel}
        </Link>
        <Link href="/" className={buttonClass('secondary')}>
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
