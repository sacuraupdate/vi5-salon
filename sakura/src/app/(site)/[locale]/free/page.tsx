import { ArrowRight, FileText, Newspaper, PlayCircle } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository } from '@/lib/data';
import type { FreeContentType } from '@/lib/data';
import { t } from '@/lib/format';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { Badge, Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

const icons: Record<FreeContentType, typeof PlayCircle> = {
  video: PlayCircle,
  article: Newspaper,
  pdf: FileText,
};

export default async function FreePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const items = await catalogRepository.listFreeContents();
  const f = await getTranslations({ locale, namespace: 'free' });
  const common = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex flex-col gap-2">
        <span className="text-[11px] font-medium tracking-[0.16em] text-vermilion uppercase">Free</span>
        <h1 className="text-2xl sm:text-3xl">{f('title')}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{f('lead')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = icons[item.type];
          return (
            <Card key={item.id} hover className="flex h-full flex-col overflow-hidden">
              <div className="relative aspect-16/9 w-full">
                <PhotoFrame kind="course" tone={item.tone} alt={t(item.title, locale)} className="h-full w-full" />
                <span className="absolute top-3 left-3">
                  <Badge tone="vermilion">
                    <Icon className="h-3 w-3" />
                    {f(item.type)}
                  </Badge>
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <span className="text-[11px] tracking-wider text-vermilion uppercase">
                  {item.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}
                </span>
                <h2 className="text-[15px] leading-snug font-medium">{t(item.title, locale)}</h2>
                <p className="text-xs leading-relaxed text-ink-muted">{t(item.summary, locale)}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-[11px] text-ink-muted">
                    {item.minutes}
                    {common('minutes')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[13px] text-vermilion">
                    {f('start')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-10 flex flex-col items-start gap-3 border-line bg-washi p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg">{f('ctaTitle')}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-ink-muted">{f('ctaBody')}</p>
        </div>
        <Link href="/courses" className={buttonClass('primary', 'lg', 'shrink-0')}>
          {f('cta')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
