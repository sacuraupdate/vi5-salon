import { BadgeCheck, CheckCircle2, Download, FileText, ListChecks, MessageSquare } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository, learnerRepository } from '@/lib/data';
import type { MaterialType } from '@/lib/data';
import { t } from '@/lib/format';
import { Card } from '@/components/ui/Card';

const icons: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  workbook: ListChecks,
  checklist: CheckCircle2,
  transcript: MessageSquare,
  quiz: BadgeCheck,
};

export default async function MaterialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const m = await getTranslations({ locale, namespace: 'mypage' });
  const [enrollments, courses] = await Promise.all([
    learnerRepository.listEnrollments(),
    catalogRepository.listCourses(),
  ]);
  const owned = courses.filter((c) => enrollments.some((e) => e.courseSlug === c.slug));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl">{m('materialsTitle')}</h1>
        <p className="text-sm leading-relaxed text-ink-muted">{m('materialsLead')}</p>
      </header>

      {/* この画面の目的はPDFに到達すること。畳まずに常時開いた状態で並べる。 */}
      <div className="flex flex-col gap-6">
        {owned.map((course) => (
          <section key={course.slug} className="flex flex-col gap-3">
            <h2 className="border-b border-line pb-2 text-[15px] font-medium">{t(course.title, locale)}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {course.materials.map((mat) => {
                const Icon = icons[mat.type];
                return (
                  <Card key={mat.id} className="flex items-center gap-3 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-medium text-ink">{t(mat.title, locale)}</span>
                      <span className="text-[11px] text-ink-muted">{mat.meta}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={m('download')}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line text-crimson hover:border-crimson"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="text-[11px] text-ink-muted">{m('demoNote')}</p>
    </div>
  );
}
