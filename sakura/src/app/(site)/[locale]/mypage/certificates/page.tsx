import { Award, Medal } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { catalogRepository, learnerRepository } from '@/lib/data';
import { formatDate, t } from '@/lib/format';
import { PetalField, SakuraDivider } from '@/components/brand/Sakura';
import { Badge, EmptyState } from '@/components/ui/Card';
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl">{m('certificatesTitle')}</h1>
        <p className="text-sm leading-relaxed text-ink-muted">{m('certificatesLead')}</p>
      </header>

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="h-5 w-5" />}
          title={m('emptyCertificates')}
          body={m('emptyCertificatesBody')}
          action={
            <Link href="/courses" className={buttonClass('primary')}>
              {m('browse')}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((cert) => {
            const course = bySlug.get(cert.courseSlug);
            const isCertification = cert.kind === 'certification';
            return (
              <article
                key={cert.id}
                className={`relative overflow-hidden rounded-md border bg-bg p-5 shadow-card ${
                  isCertification ? 'border-crimson' : 'border-sakura'
                }`}
              >
                <PetalField className="opacity-60" />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone={isCertification ? 'crimson' : 'sakura'}>
                      {isCertification ? <Medal className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                      {common(`certificate.${cert.kind}`)}
                    </Badge>
                    <span className="font-mono text-[10px] text-ink-muted">{cert.id}</span>
                  </div>

                  <SakuraDivider />

                  <p className="font-serif text-lg text-ink">{cert.holderName}</p>
                  <p className="text-[13px] leading-relaxed text-ink-muted">
                    {course ? t(course.title, locale) : cert.courseSlug}
                  </p>

                  <dl className="flex items-center justify-between gap-3 border-t border-line pt-3 text-[11px]">
                    <div>
                      <dt className="text-ink-muted">{m('certIssued')}</dt>
                      <dd className="mt-0.5 text-ink">{formatDate(cert.issuedAt, locale)}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-ink-muted">講師</dt>
                      <dd className="mt-0.5 font-serif tracking-wider text-ink">
                        {cert.instructorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}
                      </dd>
                    </div>
                  </dl>
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
