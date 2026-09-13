import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor, openGraphLocale, SITE_URL } from '@/lib/site';
import { isSiteIndexable } from '@/lib/env';
import { routing } from '@/i18n/routing';
import SiteHeader from '@/components/public/SiteHeader';
import SiteFooter from '@/components/public/SiteFooter';
import '../../globals.css';

/**
 * 言語別のメタデータ。
 * 以前は静的な日本語1件だったため、/en を開いても説明文が日本語だった。
 * canonical / hreflang / OG も言語ごとに出す。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const m = await getTranslations({ locale, namespace: 'meta' });
  const og = openGraphLocale(locale);

  return {
    metadataBase: new URL(SITE_URL),
    // 販売開始前は検索結果に載せない（robots.ts と揃える）
    robots: isSiteIndexable() ? undefined : { index: false, follow: false },
    title: { default: m('title'), template: m('titleTemplate') },
    description: m('description'),
    alternates: alternatesFor(locale),
    openGraph: {
      type: 'website',
      siteName: m('title'),
      title: m('title'),
      description: m('description'),
      url: `${SITE_URL}/${locale}`,
      locale: og.locale,
      alternateLocale: og.alternateLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: m('title'),
      description: m('description'),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
