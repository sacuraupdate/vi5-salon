import type { Metadata } from 'next';
import { AlertTriangle, Languages } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LEGAL_DOCS, isLegalTranslated, legalDocs, type LegalDocId } from '@/lib/legal';
import { alternatesFor } from '@/lib/site';
import { formatDate, tc } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

function isDocId(value: string): value is LegalDocId {
  return (LEGAL_DOCS as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => LEGAL_DOCS.map((doc) => ({ locale, doc })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}): Promise<Metadata> {
  const { locale, doc } = await params;
  if (!isDocId(doc)) return {};
  const l = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: l(doc),
    alternates: alternatesFor(locale, `/legal/${doc}`),
    // 確定前の文面を検索結果に載せない
    robots: { index: false, follow: true },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  setRequestLocale(locale);
  if (!isDocId(doc)) notFound();

  const l = await getTranslations({ locale, namespace: 'legal' });
  const contact = await getTranslations({ locale, namespace: 'contact' });
  const content = legalDocs[doc];
  const translated = isLegalTranslated(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="text-[10px] tracking-[0.3em] text-ink-muted uppercase">{l('nav')}</p>
      <h1 className="mt-2 font-serif text-[24px] leading-relaxed text-ink">{l(doc)}</h1>

      {/* 確定前であることを、本文より先に必ず出す */}
      <Card className="mt-6 border-vermilion/40 bg-vermilion/5 p-4">
        <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
          <span>
            <strong className="font-medium">{l('draftTitle')}</strong>
            <br />
            {l('draftBody')}
          </span>
        </p>
      </Card>

      {translated ? (
        <>
          <p className="mt-6 text-[11px] text-ink-muted">
            {l('updated')}: {formatDate(content.updated, locale)}
          </p>
          <div className="mt-6 flex flex-col gap-7">
            {content.sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-[15px] leading-snug font-medium text-ink">
                  {tc(section.heading, locale)}
                </h2>
                <p className="mt-2 text-[13px] leading-loose whitespace-pre-line text-ink-2">
                  {tc(section.body, locale)}
                </p>
              </section>
            ))}
          </div>
        </>
      ) : (
        // 未翻訳の言語では日本語を出さない。適用される英語版へ誘導する
        <Card className="mt-6 flex flex-col items-start gap-4 p-6">
          <Languages className="h-6 w-6 text-ink-muted" strokeWidth={1.25} />
          <h2 className="font-serif text-[17px] text-ink">{l('notTranslatedTitle')}</h2>
          <p className="text-[13px] leading-loose text-ink-muted">{l('notTranslatedBody')}</p>
          <a href={`/en/legal/${doc}`} className={buttonClass('primary')}>
            {l('readEnglish')}
          </a>
        </Card>
      )}

      <div className="mt-12 border-t border-line pt-6">
        <p className="text-[13px] text-ink-muted">{l('contactLead')}</p>
        <Link href="/contact" className="mt-2 inline-block text-[13px] text-vermilion hover:underline">
          {contact('title')} →
        </Link>
        <h2 className="mt-8 text-[10px] tracking-[0.3em] text-ink-muted uppercase">{l('otherPages')}</h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          {LEGAL_DOCS.filter((d) => d !== doc).map((d) => (
            <li key={d}>
              <Link href={`/legal/${d}`} className="text-ink-2 hover:text-vermilion">
                {l(d)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
