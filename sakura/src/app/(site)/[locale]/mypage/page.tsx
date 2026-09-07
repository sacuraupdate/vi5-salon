import { Award, BookOpen, CheckCircle2, FileText, PlayCircle } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository, learnerRepository } from '@/lib/data';
import { t } from '@/lib/format';
import ContinueCard from '@/components/public/ContinueCard';
import CourseCard from '@/components/public/CourseCard';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { Card, EmptyState, ProgressBar, SectionHeading } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const m = await getTranslations({ locale, namespace: 'mypage' });
  const [profile, enrollments, certificates, cont, courses] = await Promise.all([
    learnerRepository.getProfile(),
    learnerRepository.listEnrollments(),
    learnerRepository.listCertificates(),
    learnerRepository.getContinueLearning(),
    catalogRepository.listCourses(),
  ]);

  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  const inProgress = enrollments.filter((e) => !e.completedAt);
  const done = enrollments.filter((e) => e.completedAt);
  const materialCount = enrollments.reduce((n, e) => n + (bySlug.get(e.courseSlug)?.materials.length ?? 0), 0);
  const owned = new Set(enrollments.map((e) => e.courseSlug));
  const recommended = courses.filter((c) => !owned.has(c.slug)).slice(0, 3);

  const stats = [
    { icon: BookOpen, label: m('statLearning'), value: inProgress.length },
    { icon: CheckCircle2, label: m('statCompleted'), value: done.length },
    { icon: Award, label: m('statCertificates'), value: certificates.length },
    { icon: FileText, label: m('statMaterials'), value: materialCount },
  ];

  const contCourse = cont ? bySlug.get(cont.courseSlug) : undefined;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-xl sm:text-2xl">{m('greeting', { name: profile.name })}</h1>
      </header>

      {cont && contCourse ? (
        <ContinueCard enrollment={cont} course={contCourse} locale={locale} />
      ) : (
        <EmptyState
          icon={<PlayCircle className="h-5 w-5" />}
          title={m('emptyCourses')}
          body={m('emptyCoursesBody')}
          action={
            <Link href="/courses" className={buttonClass('primary')}>
              {m('browse')}
            </Link>
          }
        />
      )}

      {/* 概要カード：数字で今の状態が一目で分かるようにする */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-2 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-ink-2">
              <s.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
            </span>
            <span className="font-serif text-2xl leading-none">{s.value}</span>
            <span className="text-[11px] text-ink-muted">{s.label}</span>
          </Card>
        ))}
      </div>

      <section>
        <SectionHeading title={m('inProgress')} />
        <div className="mt-4 flex flex-col gap-3">
          {inProgress.map((e) => {
            const course = bySlug.get(e.courseSlug);
            if (!course) return null;
            return (
              <Link key={e.courseSlug} href={`/courses/${course.slug}`}>
                <Card hover className="grid grid-cols-[88px_1fr] items-center gap-4 p-3 sm:grid-cols-[120px_1fr]">
                  <PhotoFrame
                    kind="course"
                    tone={course.tone}
                    alt={t(course.title, locale)}
                    className="aspect-16/9 w-full rounded-sm border border-line"
                  />
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm leading-snug font-medium">{t(course.title, locale)}</h3>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={e.progressPercent} className="flex-1" />
                      <span className="text-xs text-ink-muted">{e.progressPercent}%</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading title={m('recommended')} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((c) => (
            <CourseCard key={c.slug} course={c} locale={locale} compact />
          ))}
        </div>
      </section>

      <p className="text-[11px] text-ink-muted">{m('demoNote')}</p>
    </div>
  );
}
