import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Globe,
  ListChecks,
  Medal,
  MessageSquare,
  PlayCircle,
  Star,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository } from '@/lib/data';
import { neighboursOf } from '@/lib/quiz';
import type { MaterialType } from '@/lib/data';
import { formatPrice, t } from '@/lib/format';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { Badge, Card } from '@/components/ui/Card';
import Accordion from '@/components/ui/Accordion';
import Tabs from '@/components/ui/Tabs';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

const materialIcon: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  workbook: ListChecks,
  checklist: CheckCircle2,
  transcript: MessageSquare,
  quiz: BadgeCheck,
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const course = await catalogRepository.getCourse(slug);
  if (!course) notFound();

  const [categories, instructor] = await Promise.all([
    catalogRepository.listCategories(),
    catalogRepository.getInstructor(course.instructorId),
  ]);
  const category = categories.find((c) => c.id === course.categoryId);

  const d = await getTranslations({ locale, namespace: 'courseDetail' });
  const common = await getTranslations({ locale, namespace: 'common' });

  // 学習ルート上の前後の講座。受講後に「次に何を学ぶか」で迷わせないため
  const all = await catalogRepository.listCourses();
  const around = neighboursOf(course.slug);
  const prevCourse = around.prev ? all.find((c) => c.slug === around.prev) : undefined;
  const nextCourse = around.next ? all.find((c) => c.slug === around.next) : undefined;

  const priceLabel = course.isFree ? common('free') : formatPrice(course.price, locale);

  const purchaseCard = (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-2xl text-ink">{priceLabel}</span>
        {course.isFree ? null : <span className="text-[11px] text-ink-muted">{common('from')}</span>}
      </div>

      <dl className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-2 text-ink-muted">
            <Clock className="h-4 w-4" />
            {d('duration')}
          </dt>
          <dd>
            {course.totalMinutes}
            {common('minutes')} / {course.lessonCount}
            {common('lessons')}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-2 text-ink-muted">
            <Globe className="h-4 w-4" />
            {common('languageLabel')}
          </dt>
          <dd className="text-right text-[13px] uppercase">{course.languages.join(' / ')}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-2 text-ink-muted">
            <Download className="h-4 w-4" />
            {d('includes')}
          </dt>
          <dd className="text-right text-[13px]">{course.materials.length}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-2 text-ink-muted">
            {course.certificate === 'certification' ? <Medal className="h-4 w-4" /> : <Award className="h-4 w-4" />}
            {d('tabCertificate')}
          </dt>
          <dd className="text-right text-[13px]">
            {course.certificate ? common(`certificate.${course.certificate}`) : common('certificate.none')}
          </dd>
        </div>
      </dl>

      <button type="button" className={buttonClass('primary', 'lg', 'mt-5 w-full')}>
        {d('buy')}
      </button>
      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-ink-muted">{d('buyNote')}</p>
    </Card>
  );

  const tabs = [
    {
      id: 'overview',
      label: d('tabOverview'),
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-sm leading-loose text-ink">{t(course.description, locale)}</p>
          <div>
            <h3 className="mb-3 text-base">{d('highlights')}</h3>
            <ul className="flex flex-col gap-2.5">
              {t(course.highlights, locale).map((hl) => (
                <li key={hl} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
                  {hl}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'curriculum',
      label: d('tabCurriculum'),
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-ink-muted">
            {d('curriculumNote', { lessons: course.lessonCount, minutes: course.totalMinutes })}
          </p>
          <Accordion
            items={course.curriculum.map((ch, i) => ({
              id: ch.id,
              title: `${String(i + 1).padStart(2, '0')}　${t(ch.title, locale)}`,
              body: (
                <ul className="flex flex-col divide-y divide-line">
                  {ch.lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="flex items-center gap-2 text-ink">
                        <PlayCircle className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.5} />
                        {t(l.title, locale)}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {l.isPreview ? <Badge tone="sakura">{d('preview')}</Badge> : null}
                        <span className="text-xs text-ink-muted">
                          {l.minutes}
                          {common('minutes')}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ),
            }))}
          />
        </div>
      ),
    },
    {
      id: 'materials',
      label: d('tabMaterials'),
      content: (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {course.materials.map((m) => {
              const Icon = materialIcon[m.type];
              return (
                <Card key={m.id} className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{t(m.title, locale)}</span>
                    <span className="text-[11px] text-ink-muted">{m.meta}</span>
                  </span>
                </Card>
              );
            })}
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">{d('materialsNote')}</p>
        </div>
      ),
    },
    {
      id: 'certificate',
      label: d('tabCertificate'),
      content: (
        <div className="flex flex-col gap-4">
          <Card className="flex items-start gap-4 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
              {course.certificate === 'certification' ? (
                <Medal className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Award className="h-5 w-5" strokeWidth={1.5} />
              )}
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="text-[15px] font-medium">
                {course.certificate ? common(`certificate.${course.certificate}`) : common('certificate.none')}
              </p>
              <p className="text-sm leading-relaxed text-ink-muted">
                {course.certificate === 'certification'
                  ? d('certCertification')
                  : course.certificate === 'completion'
                    ? d('certCompletion')
                    : d('certNone')}
              </p>
            </div>
          </Card>
          {course.certificate ? <p className="text-xs leading-relaxed text-ink-muted">{d('certVerify')}</p> : null}
        </div>
      ),
    },
    {
      id: 'reviews',
      label: d('tabReviews'),
      content: (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-serif text-3xl">{course.rating.toFixed(1)}</span>
            <span className="flex flex-col">
              <span className="flex gap-0.5 text-vermilion">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-3.5 w-3.5" fill={n <= Math.round(course.rating) ? 'currentColor' : 'none'} strokeWidth={1.5} />
                ))}
              </span>
              <span className="text-xs text-ink-muted">{d('reviewsCount', { count: course.reviewCount })}</span>
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {course.reviews.map((r) => (
              <Card key={r.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{r.author}</span>
                  <span className="text-[11px] text-ink-muted">{t(r.country, locale)}</span>
                </div>
                <span className="flex gap-0.5 text-vermilion">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-3 w-3" fill={n <= r.rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  ))}
                </span>
                <p className="text-sm leading-relaxed text-ink-muted">{t(r.body, locale)}</p>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      label: d('tabFaq'),
      content: (
        <Accordion
          items={course.faq.map((f, i) => ({
            id: `faq${i}`,
            title: t(f.q, locale),
            body: t(f.a, locale),
          }))}
        />
      ),
    },
  ];

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
          {/* 上部左：講座概要 */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              {category ? <Badge tone="sakura">{t(category.name, locale)}</Badge> : null}
              <Badge tone="outline">{common(`level.${course.level}`)}</Badge>
              {course.certificate ? (
                <Badge tone="neutral">
                  {course.certificate === 'certification' ? <Medal className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                  {common(`certificate.${course.certificate}`)}
                </Badge>
              ) : null}
            </div>

            <h1 className="text-2xl leading-snug sm:text-[28px]">{t(course.title, locale)}</h1>
            <p className="text-sm leading-relaxed text-ink-muted">{t(course.summary, locale)}</p>

            <Link
              href={`/instructors/${course.instructorId}`}
              className="flex w-fit items-center gap-3 rounded-sm border border-line p-2 pr-4 transition-colors hover:border-vermilion"
            >
              <PhotoFrame
                src={instructor?.photoUrl}
                alt={instructor?.name ?? ''}
                kind="portrait"
                minimal
                className="h-11 w-11 shrink-0 rounded-sm"
              />
              <span className="flex flex-col">
                <span className="text-[10px] tracking-wider text-ink-muted uppercase">{d('instructorLabel')}</span>
                <span className="font-serif text-sm tracking-[0.1em]">{instructor?.name}</span>
              </span>
            </Link>

            <PhotoFrame
              kind="course"
              tone={course.tone}
              alt={t(course.title, locale)}
              className="aspect-16/9 w-full rounded-md border border-line"
            />

            {/* モバイル：購入情報は本文の前に要約として出す */}
            <div className="lg:hidden">{purchaseCard}</div>

            <div className="mt-2 min-w-0">
              <Tabs items={tabs} />
            </div>

            {/* 学習ルート上の前後。購入後に次の一手で迷わせない */}
            {prevCourse || nextCourse ? (
              <nav aria-label={d('nextTitle')} className="mt-10 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
                {[
                  { label: d('prevTitle'), c: prevCourse, dir: 'prev' as const },
                  { label: d('nextTitle'), c: nextCourse, dir: 'next' as const },
                ]
                  .filter((x) => x.c)
                  .map(({ label, c, dir }) => (
                    <Link
                      key={dir}
                      href={`/courses/${c!.slug}`}
                      className="group flex flex-col gap-2 border border-line p-4 transition-colors hover:border-navy"
                    >
                      <span className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-ink-muted">
                        {dir === 'prev' ? <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> : null}
                        {label}
                        {dir === 'next' ? <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /> : null}
                      </span>
                      <span className="font-serif text-[15px] leading-relaxed text-ink">
                        {t(c!.title, locale)}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tracking-[0.08em] text-ink-muted">
                        <span className="text-pine">{common(`level.${c!.level}`)}</span>
                        <span aria-hidden className="text-line">|</span>
                        <span>
                          {c!.totalMinutes}
                          {common('minutes')}
                        </span>
                        {c!.certificate ? (
                          <>
                            <span aria-hidden className="text-line">|</span>
                            <span>{common(`certificate.${c!.certificate}`)}</span>
                          </>
                        ) : null}
                      </span>
                    </Link>
                  ))}
              </nav>
            ) : null}
          </div>

          {/* 上部右：購入情報カード（デスクトップは追従） */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">{purchaseCard}</div>
          </aside>
        </div>
      </div>

      {/* モバイル：購入CTAを画面下部に固定して見失わせない */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg">{priceLabel}</span>
            <span className="text-[10px] text-ink-muted">
              {course.totalMinutes}
              {common('minutes')}
            </span>
          </span>
          <button type="button" className={buttonClass('primary', 'lg', 'flex-1')}>
            {d('buy')}
          </button>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const courses = await catalogRepository.listCourses();
  return courses.map((c) => ({ slug: c.slug }));
}
