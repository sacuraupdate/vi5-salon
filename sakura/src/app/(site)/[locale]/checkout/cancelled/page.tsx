import { XCircle } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** 決済を途中でやめた場合。料金が発生していないことを必ず伝える */
export default async function CheckoutCancelledPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = await getTranslations({ locale, namespace: 'checkout' });

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="flex flex-col items-center gap-5 p-8 text-center">
        <XCircle className="h-7 w-7 text-ink-muted" strokeWidth={1.25} />
        <h1 className="font-serif text-[20px] leading-relaxed text-ink">{c('cancelledTitle')}</h1>
        <p className="text-sm leading-loose text-ink-muted">{c('cancelledBody')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/courses" className={buttonClass('primary')}>
            {c('backToCourse')}
          </Link>
          <Link href="/contact" className="text-[13px] text-vermilion hover:underline">
            {c('contactUs')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
