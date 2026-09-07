import { Award } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository, learnerRepository } from '@/lib/data';
import { formatDate, t } from '@/lib/format';
import { SakuraDivider, Seal } from '@/components/brand/Sakura';
import { BrandCrest } from '@/components/brand/BrandArt';
import { EmptyState } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

export default async function CertificatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const m = await getTranslations({ locale, namespace: 'mypage' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const [certificates, courses] = await Promise.all([
    learnerRepository.listCertificates(),
    catalogRepository.listCourses(),
  ]);
  const bySlug = new Map(courses.map((c) => [c.slug, c]));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2.5">
        <span className="eyebrow">Certificates</span>
        <h1 className="text-[21px] sm:text-[26px]">{m('certificatesTitle')}</h1>
        <p className="text-[13px] leading-loose text-ink-muted">{m('certificatesLead')}</p>
      </header>

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="h-5 w-5" strokeWidth={1.25} />}
          title={m('emptyCertificates')}
          body={m('emptyCertificatesBody')}
          action={
            <Link href="/courses" className={buttonClass('primary')}>
              {m('browse')}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {certificates.map((cert) => {
            const course = bySlug.get(cert.courseSlug);
            const isCertification = cert.kind === 'certification';
            return (
              <article
                key={cert.id}
                className="washi-texture relative flex flex-col border border-line p-6 sm:p-7"
              >
                {/* 金の細罫を上下に。面で塗らず、格式だけを足す */}
                <span className="absolute inset-x-5 top-5 h-px bg-gold opacity-70" aria-hidden />
                <span className="absolute inset-x-5 bottom-5 h-px bg-gold opacity-70" aria-hidden />

                <div className="flex items-start justify-between gap-4 pt-3">
                  <span className="eyebrow">
                    {isCertification ? 'Certification' : 'Certificate of Completion'}
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-ink-muted">{cert.id}</span>
                </div>

                <p className="mt-4 font-serif text-[13px] tracking-[0.2em] text-vermilion">
                  {common(`certificate.${cert.kind}`)}
                </p>

                <SakuraDivider className="my-5" mark={<BrandCrest className="h-5 w-5 text-gold" />} />

                <p className="font-serif text-[24px] leading-snug tracking-[0.16em] text-ink">{cert.holderName}</p>
                <p className="mt-3 text-[13px] leading-loose text-ink-2">
                  {course ? t(course.title, locale) : cert.courseSlug}
                </p>

                <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                  <dl className="flex gap-8">
                    <div>
                      <dt className="text-[9px] tracking-[0.16em] text-ink-muted">{m('certIssued')}</dt>
                      <dd className="mt-1.5 font-serif text-[13px] text-ink">{formatDate(cert.issuedAt, locale)}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] tracking-[0.16em] text-ink-muted">講師</dt>
                      <dd className="mt-1.5 font-serif text-[13px] tracking-[0.14em] text-ink">
                        {cert.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}
                      </dd>
                    </div>
                  </dl>
                  <Seal label={isCertification ? '認定' : '修了'} />
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-ink-muted">{m('demoNote')}</p>
    </div>
  );
}
