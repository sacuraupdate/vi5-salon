import { Captions, CheckCircle2, Circle, Clapperboard, Construction, FileText, Video } from 'lucide-react';
import AccessDenied from '@/components/admin/AccessDenied';
import { ownerOnly } from '@/lib/admin-auth';
import { catalogRepository } from '@/lib/data';
import { isVideoReady } from '@/lib/video';
import { localeLabelJa } from '@/lib/format';
import { LOCALES } from '@/lib/data';
import { Card } from '@/components/ui/Card';

/** 登録状況を実データから出すため、静的生成しない */
export const dynamic = 'force-dynamic';

export default async function Page() {
  // メニューから隠すだけでは URL 直打ちを防げないため、サーバー側で必ず判定する
  const { allowed } = await ownerOnly();
  if (!allowed) return <AccessDenied what="講座制作" />;

  const courses = await catalogRepository.listCourses({ includeUnlisted: true });
  // 動画IDの登録が必要な講座（制作中のものを上に出す）
  const target = courses.filter((c) => !c.isFree);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
          <Clapperboard className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl">講座制作</h1>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            章ごとの動画・字幕・教材・公開状況を確認できます。
          </p>
        </div>
      </header>

      <Card className="flex items-start gap-3 border-line bg-washi p-4">
        <Construction className="mt-0.5 h-5 w-5 shrink-0 text-vermilion" strokeWidth={1.5} />
        <div className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-ink">
          <p>
            この画面からの<strong className="font-medium">登録・保存は Phase 2 で作ります</strong>。
            今は、どの章に何が足りていないかを確認するための画面です。
          </p>
          <p className="text-ink-muted">
            動画は YouTube に<strong className="font-medium">「限定公開」</strong>でアップロードし、
            <strong className="font-medium">「埋め込みを許可」</strong>を有効にしてください。
            動画IDは URL の <code className="font-mono">watch?v=</code> のあとの11文字です。
            登録は現在、開発側で <code className="font-mono">src/lib/data/mock/catalog.ts</code> の
            <code className="font-mono">video.id</code> に入れます。
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {target.map((course) => {
          const ready = course.curriculum.filter((ch) => isVideoReady(ch.video)).length;
          const openLocales = LOCALES.filter((l) => course.availability?.[l] === 'published');

          return (
            <Card key={course.slug} className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[15px] font-medium">{course.title.ja}</h2>
                <span className="text-[12px] text-ink-muted">
                  動画 {ready} / {course.curriculum.length} 章 登録済み
                </span>
              </div>

              <p className="text-[12px] text-ink-muted">
                公開中の言語：
                {openLocales.length > 0
                  ? openLocales.map((l) => localeLabelJa[l]).join('・')
                  : 'なし（どの言語でも販売していません）'}
              </p>

              <ul className="flex flex-col divide-y divide-line border-t border-line">
                {course.curriculum.map((ch, i) => {
                  const hasVideo = isVideoReady(ch.video);
                  const captions = ch.video?.captions ?? [];
                  return (
                    <li key={ch.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                      <span className="font-mono text-[11px] text-ink-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{ch.title.ja}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12px] ${
                          hasVideo ? 'text-pine' : 'text-vermilion'
                        }`}
                      >
                        {hasVideo ? (
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        ) : (
                          <Circle className="h-3.5 w-3.5" strokeWidth={1.5} />
                        )}
                        <Video className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {hasVideo ? '動画あり' : '動画未登録'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
                        <Captions className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {captions.length > 0
                          ? captions.map((l) => localeLabelJa[l]).join('・')
                          : '字幕なし'}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="inline-flex items-center gap-2 text-[12px] text-ink-muted">
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                教材 {course.materials.filter((m) => m.status !== 'planned').length} /{' '}
                {course.materials.length} 点 提供可能
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
