import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository, learnerRepository } from '@/lib/data';
import { t } from '@/lib/format';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { Badge, Card, ProgressBar, SectionHeading } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';

export default async function MyCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const m = await getTranslations({ locale, namespace: 'mypage' });
  const [enrollments, courses] = await Promise.all([
    learnerRepository.listEnrollments(),
    catalogRepository.listCourses(),
  ]);
  const bySlug = new Map(courses.map((c) => [c.slug, c]));

  const section = (title: string, list: typeof enrollments, completed: boolean) => (
    <section>
      <SectionHeading title={title} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {list.map((e) => {
          const course = bySlug.get(e.courseSlug);
          if (!course) return null;
          return (
            <Link key={e.courseSlug} href={`/courses/${course.slug}`}>
              <Card hover className="flex h-full flex-col gap-3 p-3">
                <div className="grid grid-cols-[96px_1fr] gap-3">
                  <PhotoFrame
                    kind="course"
                    tone={course.tone}
                    alt={t(course.title, locale)}
                    className="aspect-16/9 w-full rounded-sm border border-line"
                  />
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm leading-snug font-medium">{t(course.title, locale)}</h3>
                    <span className="text-[11px] tracking-wider text-ink-muted uppercase">
                      {course.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}
                    </span>
                  </div>
                </div>
                {completed ? (
                  <Badge tone="sakura">{m('statCompleted')}</Badge>
                ) : (
                  <div className="flex items-center gap-3">
                    <ProgressBar value={e.progressPercent} className="flex-1" />
                    <span className="text-xs text-ink-muted">{e.progressPercent}%</span>
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl sm:text-2xl">{m('navCourses')}</h1>
      {section(m('inProgress'), enrollments.filter((e) => !e.completedAt), false)}
      {section(m('completed'), enrollments.filter((e) => e.completedAt), true)}
    </div>
  );
}
