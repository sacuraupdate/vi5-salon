import { ArrowLeft, Lock, PlayCircle } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository } from '@/lib/data';
import { getSession } from '@/lib/session';
import { hasEntitlement } from '@/lib/entitlement';
import { isChapterOpen, tcText } from '@/lib/format';
import { isVideoReady } from '@/lib/video';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

/** 受講権限を実行時に確認するため、静的生成しない */
export const dynamic = 'force-dynamic';

export default async function LearnCoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // 1. ログインしているか
  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/learn/${slug}`);

  const course = await catalogRepository.getCourseAny(slug);
  if (!course) notFound();

  const l = await getTranslations({ locale, namespace: 'learn' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const preparing = common('preparing');

  // 2. その講座を買っているか。買っていなければ中身を出さない
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/mypage/courses"
        className="inline-flex items-center gap-2 text-[13px] text-ink-muted hover:text-vermilion"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        {l('backToCourses')}
      </Link>

      <h1 className="mt-5 font-serif text-[22px] leading-relaxed text-ink">
        {tcText(course.title, locale, preparing)}
      </h1>
      <p className="mt-2 text-[12px] text-ink-muted">{l('noExtraCost')}</p>

      <h2 className="mt-8 border-b border-line pb-2 text-[11px] tracking-[0.2em] text-ink-muted uppercase">
        {l('chapterList')}
      </h2>
      <ol className="mt-4 flex flex-col gap-2">
        {course.curriculum.map((ch, i) => {
          // 公開済み かつ 動画IDが登録済みの章だけ開ける
          const open = isChapterOpen(course, ch, locale) && isVideoReady(ch.video);
          const title = tcText(ch.title, locale, preparing);
          const label = (
            <>
              <span className="mt-0.5 shrink-0 font-mono text-[11px] text-ink-muted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-[14px] leading-snug">{title}</span>
              {open ? (
                <PlayCircle className="h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
              ) : (
                <span className="shrink-0 text-[11px] whitespace-nowrap text-ink-muted">
                  {l('chapterLocked')}
                </span>
              )}
            </>
          );

          return (
            <li key={ch.id}>
              {open ? (
                <Link
                  href={`/learn/${slug}/${ch.id}`}
                  className="flex min-h-[56px] items-start gap-3 border border-line p-4 transition-colors hover:border-ink-2"
                >
                  {label}
                </Link>
              ) : (
                <div className="flex min-h-[56px] items-start gap-3 border border-line bg-washi/60 p-4 text-ink-muted">
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
