import { Award, Medal, PlayCircle } from 'lucide-react';
import { adminRepository, catalogRepository } from '@/lib/data';
import type { Locale } from '@/lib/data';
import { getAdminRole } from '@/lib/admin-session';
import { formatDateJa, formatJpy, localeLabelJa, translationStatus, translationStatusLabel } from '@/lib/format';
import { Badge, Card } from '@/components/ui/Card';
import PhotoFrame from '@/components/brand/PhotoFrame';

const targetLocales: Exclude<Locale, 'ja'>[] = ['en', 'ko', 'zh-TW'];

export default async function AdminCoursesPage() {
  const role = await getAdminRole();
  const isOwner = role === 'owner';

  const all = await catalogRepository.listCourses();
  const courses = isOwner ? all : all.filter((c) => c.instructorId === 'tomomi');
  const sales = await adminRepository.listCourseSales(role);
  const salesBySlug = new Map(sales.map((s) => [s.courseSlug, s]));

  const needsAttention = courses.filter((c) =>
    targetLocales.some((l) => translationStatus(c.translation, l) !== 'translated'),
  ).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl">講座</h1>
        <p className="text-[13px] text-ink-muted">
          公開中の講座と、翻訳の状態を確認できます。日本語が原本です。
        </p>
      </header>

      {needsAttention > 0 ? (
        <Card className="flex items-center gap-3 border-crimson p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-crimson text-white">
            <PlayCircle className="h-4.5 w-4.5" strokeWidth={1.5} />
          </span>
          <p className="text-[13px] leading-relaxed">
            翻訳の対応が必要な講座が <strong>{needsAttention}件</strong> あります。
            日本語を更新した講座は、翻訳も更新してください。
          </p>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {courses.map((course) => {
          const sale = salesBySlug.get(course.slug);
          return (
            <Card key={course.slug} className="grid gap-3 p-3 sm:grid-cols-[120px_1fr] sm:gap-4 sm:p-4">
              <PhotoFrame
                kind="course"
                tone={course.tone}
                minimal
                alt={course.title.ja}
                className="hidden aspect-16/9 w-full rounded-sm border border-line sm:block"
              />
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-medium">{course.title.ja}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                      <span className="tracking-wider uppercase">
                        {course.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}
                      </span>
                      <span aria-hidden>・</span>
                      <span>
                        {course.lessonCount}レッスン / {course.totalMinutes}分
                      </span>
                      <span aria-hidden>・</span>
                      <span>日本語の更新：{formatDateJa(course.translation.masterUpdatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-serif text-[15px]">
                      {course.isFree ? '無料' : formatJpy(course.price.JPY)}
                    </span>
                    {sale ? <span className="text-[11px] text-ink-muted">今月 {sale.orders}件</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {course.certificate ? (
                    <Badge tone="sakura">
                      {course.certificate === 'certification' ? (
                        <Medal className="h-3 w-3" />
                      ) : (
                        <Award className="h-3 w-3" />
                      )}
                      {course.certificate === 'certification' ? '認定証' : '修了証'}
                    </Badge>
                  ) : (
                    <Badge tone="outline">証明書なし</Badge>
                  )}
                </div>

                {/* 翻訳ステータス：日本語原本より古い翻訳を判別できるようにする */}
                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-[11px] text-ink-muted">翻訳の状態</span>
                  {targetLocales.map((l) => {
                    const status = translationStatus(course.translation, l);
                    const tone = status === 'translated' ? 'neutral' : status === 'outdated' ? 'crimson' : 'outline';
                    return (
                      <Badge key={l} tone={tone}>
                        {localeLabelJa[l]}：{translationStatusLabel[status]}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-muted">※ Phase 1 のため、編集機能はまだ動作しません。</p>
    </div>
  );
}
