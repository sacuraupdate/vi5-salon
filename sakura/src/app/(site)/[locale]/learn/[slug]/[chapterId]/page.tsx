import { ArrowLeft, ArrowRight, Captions, Clock, Lock } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository } from '@/lib/data';
import { getSession } from '@/lib/session';
import { hasEntitlement } from '@/lib/entitlement';
import { isChapterOpen, tcText } from '@/lib/format';
import { embedSource } from '@/lib/video';
import type { Locale } from '@/lib/data';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

/**
 * 章の受講画面。
 *
 * 動画IDをHTMLに出す条件は次のすべてを満たしたときだけ：
 *   1. ログインしている
 *   2. その講座の受講権限がある
 *   3. その章がその言語で公開されている
 *   4. 動画IDが登録されている
 * ひとつでも欠ければ、HTML に動画IDは一切含まれない。
 */
export const dynamic = 'force-dynamic';

export default async function LearnChapterPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; chapterId: string }>;
}) {
  const { locale, slug, chapterId } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/learn/${slug}/${chapterId}`);

  const course = await catalogRepository.getCourse(slug);
  if (!course) notFound();

  const index = course.curriculum.findIndex((c) => c.id === chapterId);
  if (index < 0) notFound();
  const chapter = course.curriculum[index];

  const l = await getTranslations({ locale, namespace: 'learn' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const preparing = common('preparing');
  const title = tcText(chapter.title, locale, preparing);

  const entitled = await hasEntitlement(session, slug);
  if (!entitled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="flex flex-col items-center gap-5 p-8 text-center">
          <Lock className="h-7 w-7 text-ink-muted" strokeWidth={1.25} />
          <h1 className="font-serif text-[20px] leading-relaxed text-ink">{l('notPurchasedTitle')}</h1>
          <p className="text-sm leading-loose text-ink-muted">{l('notPurchasedBody')}</p>
          <Link href={`/courses/${slug}`} className={buttonClass('primary')}>
            {l('viewCourse')}
          </Link>
        </Card>
      </div>
    );
  }

  // 公開済みの章に限り、動画の埋め込み先を解決する。未公開・未登録なら null
  const open = isChapterOpen(course, chapter, locale);
  const embed = open ? embedSource(chapter.video, locale as Locale, title) : null;
  const hasCaptions = chapter.video?.captions.includes(locale as Locale) ?? false;

  const prev = index > 0 ? course.curriculum[index - 1] : null;
  const next = index + 1 < course.curriculum.length ? course.curriculum[index + 1] : null;
  const canOpen = (c: typeof chapter | null) =>
    Boolean(c && isChapterOpen(course, c, locale) && c.video?.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Link
        href={`/learn/${slug}`}
        className="inline-flex items-center gap-2 text-[13px] text-ink-muted hover:text-vermilion"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        {tcText(course.title, locale, preparing)}
      </Link>

      <p className="mt-5 text-[11px] tracking-[0.2em] text-vermilion uppercase">
        {l('chapter', { n: index + 1 })}
      </p>
      <h1 className="mt-1.5 font-serif text-[21px] leading-relaxed text-ink">{title}</h1>

      {embed ? (
        <>
          <div className="mt-5 aspect-video w-full border border-line bg-ink">
            <iframe
              src={embed.url}
              title={embed.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          </div>
          <p className="mt-2.5 flex items-center gap-2 text-[11px] text-ink-muted">
            <Captions className="h-3.5 w-3.5" strokeWidth={1.5} />
            {hasCaptions ? l('captions') : l('captionsNone')}
          </p>
        </>
      ) : (
        // 未公開・動画未登録の章。追加料金がかからないことを明示する
        <Card className="mt-5 flex flex-col items-center gap-4 p-8 text-center">
          <Clock className="h-6 w-6 text-ink-muted" strokeWidth={1.25} />
          <h2 className="font-serif text-[17px] text-ink">{l('videoPendingTitle')}</h2>
          <p className="max-w-md text-sm leading-loose text-ink-muted">{l('videoPendingBody')}</p>
        </Card>
      )}

      {chapter.description ? (
        <p className="mt-6 text-sm leading-loose text-ink-2">
          {tcText(chapter.description, locale, preparing)}
        </p>
      ) : null}

      <nav className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-5 text-[13px]">
        {canOpen(prev) && prev ? (
          <Link href={`/learn/${slug}/${prev.id}`} className="inline-flex items-center gap-2 hover:text-vermilion">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            <span className="line-clamp-1">{tcText(prev.title, locale, preparing)}</span>
          </Link>
        ) : (
          <span />
        )}
        {canOpen(next) && next ? (
          <Link
            href={`/learn/${slug}/${next.id}`}
            className="inline-flex items-center gap-2 text-right hover:text-vermilion"
          >
            <span className="line-clamp-1">{tcText(next.title, locale, preparing)}</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
