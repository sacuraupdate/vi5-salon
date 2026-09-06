import { getTranslations, setRequestLocale } from 'next-intl/server';
import { learnerRepository } from '@/lib/data';
import { formatDate, t } from '@/lib/format';
import { Card } from '@/components/ui/Card';

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const m = await getTranslations({ locale, namespace: 'mypage' });
  const a = await getTranslations({ locale, namespace: 'auth' });
  const profile = await learnerRepository.getProfile();

  const rows = [
    { label: a('name'), value: profile.name },
    { label: a('email'), value: profile.email },
    { label: a('country'), value: t(profile.country, locale) },
    { label: m('memberSince'), value: formatDate(profile.memberSince, locale) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl">{m('accountTitle')}</h1>
        <p className="text-sm leading-relaxed text-ink-muted">{m('accountLead')}</p>
      </header>

      <Card>
        <dl className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-4 py-4">
              <dt className="text-[13px] text-ink-muted">{r.label}</dt>
              <dd className="text-sm text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <p className="text-[11px] text-ink-muted">{m('demoNote')}</p>
    </div>
  );
}
