import { SlidersHorizontal, X } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { t } from '@/lib/format';
import type { Category, Locale } from '@/lib/data';

type Query = Record<string, string | undefined>;

/** 絞り込みは URL クエリで表現する（共有・戻る操作に耐えるため） */
function href(current: Query, key: string, value: string) {
  const next: Query = { ...current, [key]: value === 'all' ? undefined : value };
  const qs = Object.entries(next)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join('&');
  return `/courses${qs ? `?${qs}` : ''}`;
}

function Row({
  label,
  options,
  paramKey,
  current,
}: {
  label: string;
  options: { value: string; label: string }[];
  paramKey: string;
  current: Query;
}) {
  const active = current[paramKey] ?? 'all';
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium tracking-wider text-ink-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = active === o.value;
          return (
            <Link
              key={o.value}
              href={href(current, paramKey, o.value)}
              className={`inline-flex min-h-9 items-center rounded-sm border px-3 text-[13px] transition-colors ${
                on
                  ? 'border-crimson bg-crimson text-white'
                  : 'border-line bg-bg text-ink hover:border-crimson hover:text-crimson'
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function CourseFilters({
  locale,
  categories,
  current,
  resultCount,
}: {
  locale: string;
  categories: Category[];
  current: Query;
  resultCount: number;
}) {
  const c = await getTranslations({ locale, namespace: 'courses' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const all = { value: 'all', label: c('all') };
  const rows = [
    {
      label: c('category'),
      paramKey: 'category',
      options: [all, ...categories.map((cat) => ({ value: cat.id, label: t(cat.name, locale) }))],
    },
    {
      label: c('instructor'),
      paramKey: 'instructor',
      options: [all, { value: 'sakura', label: 'SAKURA' }, { value: 'tomomi', label: 'TOMOMI' }],
    },
    {
      label: c('level'),
      paramKey: 'level',
      options: [
        all,
        { value: 'beginner', label: common('level.beginner') },
        { value: 'intermediate', label: common('level.intermediate') },
        { value: 'advanced', label: common('level.advanced') },
      ],
    },
    {
      label: c('language'),
      paramKey: 'language',
      options: [
        all,
        ...(['ja', 'en', 'ko', 'zh-TW'] as Locale[]).map((l) => ({ value: l, label: l.toUpperCase() })),
      ],
    },
  ];

  const hasFilter = Object.entries(current).some(([, v]) => v);

  const body = (
    <div className="flex flex-col gap-4">
      {rows.map((r) => (
        <Row key={r.paramKey} {...r} current={current} />
      ))}
      {hasFilter ? (
        <Link href="/courses" className="inline-flex items-center gap-1 self-start text-[13px] text-crimson hover:underline">
          <X className="h-3.5 w-3.5" />
          {c('filterReset')}
        </Link>
      ) : null}
    </div>
  );

  return (
    <>
      {/* モバイル：畳んでおき、必要なときだけ開く */}
      <details className="rounded-md border border-line bg-bg lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-crimson" />
            {c('filterOpen')}
          </span>
          <span className="text-[13px] font-normal text-ink-muted">{c('resultCount', { count: resultCount })}</span>
        </summary>
        <div className="border-t border-line p-4">{body}</div>
      </details>

      {/* デスクトップ：常時表示のサイドパネル */}
      <div className="hidden lg:block">
        <div className="rounded-md border border-line bg-bg p-5">{body}</div>
      </div>
    </>
  );
}
