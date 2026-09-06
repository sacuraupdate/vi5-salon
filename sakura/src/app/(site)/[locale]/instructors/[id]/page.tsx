import { ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository } from '@/lib/data';
import type { InstructorId } from '@/lib/data';
import { t } from '@/lib/format';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { PetalField } from '@/components/brand/Sakura';
import CourseCard from '@/components/public/CourseCard';
import { Badge, Card, SectionHeading } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';

export function generateStaticParams() {
  return [{ id: 'sakura' }, { id: 'tomomi' }];
}

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (id !== 'sakura' && id !== 'tomomi') notFound();
  const instructor = await catalogRepository.getInstructor(id as InstructorId);
  if (!instructor) notFound();

  const [courses, categories] = await Promise.all([
    catalogRepository.listCourses({ instructorId: id }),
    catalogRepository.listCategories(),
  ]);
  const i18n = await getTranslations({ locale, namespace: 'instructor' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const own = categories.filter((c) => instructor.categoryIds.includes(c.id));

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-linear-to-b from-sakura-soft to-bg">
        <PetalField />
        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:py-12 lg:grid-cols-[340px_1fr] lg:gap-10">
          <PhotoFrame
            src={instructor.photoUrl}
            alt={instructor.name}
            kind="portrait"
            tone={id === 'tomomi' ? 2 : 0}
            priority
            className="h-64 w-full rounded-md border border-line shadow-card sm:h-80 lg:h-[420px]"
          />
          <div className="flex flex-col items-start gap-4 lg:justify-center">
            <h1 className="font-serif text-3xl tracking-[0.14em]">{instructor.name}</h1>
            <Badge tone="sakura">{t(instructor.role, locale)}</Badge>
            <p className="font-serif text-lg leading-relaxed text-ink sm:text-xl">{t(instructor.headline, locale)}</p>
            <dl className="grid grid-cols-3 gap-6 border-t border-line pt-4">
              {instructor.stats.map((s) => (
                <div key={s.value}>
                  <dt className="font-serif text-xl">{s.value}</dt>
                  <dd className="text-[11px] text-ink-muted">{t(s.label, locale)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-10">
          <div>
            <h2 className="mb-3 text-xl">{i18n('profile')}</h2>
            <p className="text-sm leading-loose text-ink">{t(instructor.bio, locale)}</p>
          </div>
          <Card className="h-fit p-5">
            <h2 className="mb-3 text-base">{i18n('expertise')}</h2>
            <ul className="flex flex-col gap-2">
              {own.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/courses?category=${c.id}`}
                    className="flex items-center justify-between gap-2 py-1.5 text-sm hover:text-crimson"
                  >
                    {t(c.name, locale)}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <SectionHeading
            eyebrow="Courses"
            title={i18n('coursesTitle')}
            action={
              <Link href={`/courses?instructor=${id}`} className="inline-flex items-center gap-1 text-sm text-crimson hover:underline">
                {common('viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <CourseCard key={c.slug} course={c} locale={locale} compact />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
