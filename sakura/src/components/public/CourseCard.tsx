import { Award, Clock, Medal, PlayCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { Badge, Card } from '@/components/ui/Card';
import { formatPrice, t } from '@/lib/format';
import type { Course } from '@/lib/data';

export default async function CourseCard({
  course,
  locale,
  compact = false,
}: {
  course: Course;
  locale: string;
  compact?: boolean;
}) {
  const c = await getTranslations({ locale, namespace: 'common' });

  return (
    <Card hover className="flex h-full flex-col overflow-hidden">
      <Link href={`/courses/${course.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-16/9 w-full shrink-0">
          <PhotoFrame kind="course" tone={course.tone} alt={t(course.title, locale)} className="h-full w-full" />
          {course.isFree ? (
            <span className="absolute top-3 left-3">
              <Badge tone="crimson">{c('free')}</Badge>
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            <span className="font-medium tracking-wider text-crimson uppercase">
              {course.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}
            </span>
            <span aria-hidden>・</span>
            <span>{c(`level.${course.level}`)}</span>
          </div>

          <h3 className="line-clamp-2 text-[15px] leading-snug font-medium text-ink">{t(course.title, locale)}</h3>

          {compact ? null : (
            <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">{t(course.summary, locale)}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.totalMinutes}
              {c('minutes')}
            </span>
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5" />
              {course.lessonCount}
              {c('lessons')}
            </span>
            <span className="inline-flex items-center gap-1 uppercase">
              {course.languages.join(' / ')}
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            {course.certificate ? (
              <Badge tone="sakura">
                {course.certificate === 'certification' ? (
                  <Medal className="h-3 w-3" />
                ) : (
                  <Award className="h-3 w-3" />
                )}
                {c(`certificate.${course.certificate}`)}
              </Badge>
            ) : (
              <span />
            )}
            <span className="font-serif text-base whitespace-nowrap text-ink">
              {course.isFree ? c('free') : formatPrice(course.price, locale)}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
