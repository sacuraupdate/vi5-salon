import { SearchX } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { catalogRepository } from '@/lib/data';
import CourseCard from '@/components/public/CourseCard';
import CourseFilters from '@/components/public/CourseFilters';
import { EmptyState } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';

const PAGE_SIZE = 9;

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined;

  const current = {
    category: one('category'),
    instructor: one('instructor'),
    level: one('level'),
    language: one('language'),
  };

  const c = await getTranslations({ locale, namespace: 'courses' });

  const [courses, categories] = await Promise.all([
    catalogRepository.listCourses({
      categoryId: current.category,
      instructorId: current.instructor,
      level: current.level,
      language: current.language,
    }),
    catalogRepository.listCategories(),
  ]);

  // 10件以上を一度に縦へ並べない（CLAUDE.md 第6章）
  const showAll = one('more') === '1';
  const visible = showAll ? courses : courses.slice(0, PAGE_SIZE);
  const moreHref = `/courses?${new URLSearchParams(
    Object.entries({ ...current, more: '1' }).filter(([, v]) => v) as [string, string][],
  ).toString()}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl">{c('title')}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{c('lead')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CourseFilters locale={locale} categories={categories} current={current} resultCount={courses.length} />
        </aside>

        <div>
          <p className="mb-4 hidden text-sm text-ink-muted lg:block">{c('resultCount', { count: courses.length })}</p>

          {visible.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-5 w-5" />}
              title={c('emptyTitle')}
              body={c('emptyBody')}
              action={
                <Link href="/courses" className={buttonClass('secondary')}>
                  {c('filterReset')}
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((course) => (
                  <CourseCard
                    key={course.slug}
                    course={course}
                    locale={locale}
                    category={categories.find((cat) => cat.id === course.categoryId)}
                  />
                ))}
              </div>
              {!showAll && courses.length > PAGE_SIZE ? (
                <div className="mt-8 flex justify-center">
                  <Link href={moreHref} className={buttonClass('secondary', 'lg')}>
                    {c('more')}（{courses.length - PAGE_SIZE}）
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
