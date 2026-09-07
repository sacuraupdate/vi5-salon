import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell, { Field } from '@/components/public/AuthShell';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const a = await getTranslations({ locale, namespace: 'auth' });

  return (
    <AuthShell
      title={a('registerTitle')}
      lead={a('registerLead')}
      brandCopy={a('brandCopy')}
      demoNote={a('demoNote')}
      footer={
        <p className="flex flex-wrap items-center gap-2 text-ink-muted">
          {a('toLogin')}
          <Link href="/login" className="text-vermilion hover:underline">
            {a('loginTitle')}
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-4">
        <Field id="name" label={a('name')} autoComplete="name" />
        <Field id="email" label={a('email')} type="email" autoComplete="email" placeholder="you@example.com" />
        <Field id="password" label={a('password')} type="password" autoComplete="new-password" />
        <Field id="country" label={a('country')} autoComplete="country-name" />
        <Link href="/mypage" className={buttonClass('primary', 'lg', 'mt-1 w-full')}>
          {a('submitRegister')}
        </Link>
        <p className="text-[11px] leading-relaxed text-ink-muted">{a('terms')}</p>
      </form>
    </AuthShell>
  );
}
