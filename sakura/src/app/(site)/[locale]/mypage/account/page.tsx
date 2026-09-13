import { LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { learnerRepository } from '@/lib/data';
import { formatDate, tcText } from '@/lib/format';
import { getSession, isSiteDemoMode } from '@/lib/session';
import { signOutAction } from '@/app/(site)/auth-actions';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/mypage/account`);

  const m = await getTranslations({ locale, namespace: 'mypage' });
  const a = await getTranslations({ locale, namespace: 'auth' });
  const preparing = (await getTranslations({ locale, namespace: 'common' }))('preparing');

  // メールはログイン中のアカウントの実データ。
  // 氏名・国は登録時に受け取っていないため、確認用の表示は開発環境だけに残す
  const demo = isSiteDemoMode();
  const profile = demo ? await learnerRepository.getProfile() : null;

  const rows = [
    { label: a('email'), value: session.email },
    ...(profile
      ? [
          { label: a('name'), value: profile.name },
          { label: a('country'), value: tcText(profile.country, locale, preparing) },
          { label: m('memberSince'), value: formatDate(profile.memberSince, locale) },
        ]
      : []),
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
              <dd className="text-sm break-all text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className={buttonClass('secondary', 'md')}>
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          {a('signOut')}
        </button>
      </form>

      {demo ? <p className="text-[11px] text-ink-muted">{m('demoNote')}</p> : null}
    </div>
  );
}
