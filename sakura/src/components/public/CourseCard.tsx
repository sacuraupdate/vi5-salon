import { Award, Clock, Medal, PlayCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { Badge } from '@/components/ui/Card';
import { formatPrice, t } from '@/lib/format';
import type { Category, Course } from '@/lib/data';

/**
 * 講座カード。商品一覧ではなく「教育プログラムの目録」として見せる。
 * 何が身につくか（highlights の先頭）と、証明書の有無を必ず伝える。
 */
export default async function CourseCard({
  course,
  locale,
  category,
  compact = false,
}: {
  course: Course;
  locale: string;
  category?: Category;
  compact?: boolean;
}) {
  const c = await getTranslations({ locale, namespace: 'common' });
  const gain = t(course.highlights, locale)[0];

  return (
    <article className="h-full">
      <Link
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col border border-line bg-bg transition-colors hover:border-ink-2"
      >
        <div className="relative aspect-16/9 w-full shrink-0 border-b border-line">
          <PhotoFrame kind="course" tone={course.tone} alt={t(course.title, locale)} className="h-full w-full" />
          {course.isFree ? (
            <span className="absolute top-3 left-3">
              <Badge tone="vermilion">{c('free')}</Badge>
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* 講師とカテゴリー＝専門領域を先に示す */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] tracking-[0.12em] text-ink-muted">
            <span className="text-navy">{course.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}</span>
            {category ? (
              <>
                <span aria-hidden className="text-line">|</span>
                <span className="text-pine">{t(category.name, locale)}</span>
              </>
            ) : null}
            <span aria-hidden className="text-line">|</span>
            <span>{c(`level.${course.level}`)}</span>
          </div>

          <h3 className="font-serif text-[16px] leading-relaxed tracking-[0.06em] text-ink">
            {t(course.title, locale)}
          </h3>

          {compact ? null : (
            <p className="line-clamp-2 text-[12px] leading-loose text-ink-muted">{t(course.summary, locale)}</p>
          )}

          {/* 得られること：教育プログラムであることを最も端的に示す一行 */}
          {gain ? (
            <p className="border-l-2 border-vermilion pl-3 text-[12px] leading-relaxed text-ink-2">{gain}</p>
          ) : null}

          <div className="mt-auto flex flex-col gap-3 pt-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[10px] tracking-[0.08em] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.25} />
                {course.totalMinutes}
                {c('minutes')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-3.5 w-3.5" strokeWidth={1.25} />
                {course.lessonCount}
                {c('lessons')}
              </span>
              <span className="uppercase">{course.languages.join(' / ')}</span>
            </div>

            <div className="flex items-end justify-between gap-3">
              {course.certificate ? (
                <Badge tone={course.certificate === 'certification' ? 'gold' : 'sakura'}>
                  {course.certificate === 'certification' ? (
                    <Medal className="h-3 w-3" strokeWidth={1.5} />
                  ) : (
                    <Award className="h-3 w-3" strokeWidth={1.5} />
                  )}
                  {c(`certificate.${course.certificate}`)}
                </Badge>
              ) : (
                <span />
              )}
              <span className="font-serif text-[17px] whitespace-nowrap text-ink">
                {course.isFree ? c('free') : formatPrice(course.price, locale)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
