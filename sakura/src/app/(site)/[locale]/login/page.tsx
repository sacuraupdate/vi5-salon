import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell, { Field } from '@/components/public/AuthShell';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const a = await getTranslations({ locale, namespace: 'auth' });

  return (
    <AuthShell
      title={a('loginTitle')}
      lead={a('loginLead')}
      brandCopy={a('brandCopy')}
      demoNote={a('demoNote')}
      footer={
        <p className="flex flex-wrap items-center gap-2 text-ink-muted">
          {a('toRegister')}
          <Link href="/register" className="text-crimson hover:underline">
            {a('registerTitle')}
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-4">
        <Field id="email" label={a('email')} type="email" autoComplete="email" placeholder="you@example.com" />
        <Field id="password" label={a('password')} type="password" autoComplete="current-password" />
        <Link href="/mypage" className={buttonClass('primary', 'lg', 'mt-1 w-full')}>
          {a('submitLogin')}
        </Link>
        <Link href="/login" className="self-center text-[13px] text-ink-muted hover:text-crimson">
          {a('forgot')}
        </Link>
      </form>
    </AuthShell>
  );
}
