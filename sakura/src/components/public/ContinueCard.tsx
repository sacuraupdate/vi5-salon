import { PlayCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { ProgressBar } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { t } from '@/lib/format';
import type { Course, Enrollment } from '@/lib/data';

/**
 * ログイン直後の最重要操作。
 * 「続きから学ぶ」は必ず1クリックでレッスンへ到達させる。
 */
export default async function ContinueCard({
  enrollment,
  course,
  locale,
}: {
  enrollment: Enrollment;
  course: Course;
  locale: string;
}) {
  const m = await getTranslations({ locale, namespace: 'mypage' });

  return (
    <section className="overflow-hidden rounded-md border border-sakura bg-sakura-soft">
      <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-5 sm:p-5">
        <PhotoFrame
          kind="course"
          tone={course.tone}
          alt={t(course.title, locale)}
          className="h-24 w-full rounded-sm border border-line sm:aspect-4/3 sm:h-auto"
        />
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-medium tracking-[0.14em] text-crimson uppercase">
            {m('continueTitle')}
          </span>
          <h2 className="text-lg leading-snug">{t(course.title, locale)}</h2>
          <p className="text-[13px] text-ink-muted">
            {m('continueLesson')}：{t(enrollment.lastLessonTitle, locale)}
          </p>

          <div className="flex items-center gap-3">
            <ProgressBar value={enrollment.progressPercent} className="flex-1" />
            <span className="font-serif text-sm text-ink">{enrollment.progressPercent}%</span>
          </div>

          <Link
            href={`/courses/${course.slug}`}
            className={buttonClass('primary', 'lg', 'mt-1 w-full sm:w-fit')}
          >
            <PlayCircle className="h-4.5 w-4.5" />
            {m('continueCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
