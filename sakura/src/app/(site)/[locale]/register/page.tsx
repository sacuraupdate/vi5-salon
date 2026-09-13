import { Info } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell, { Field } from '@/components/public/AuthShell';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

/** 確認用フラグを実行時に読むため、静的生成しない */
export const dynamic = 'force-dynamic';

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
      {/* 会員登録は未実装。作成できるように見せない */}
      <div className="mb-5 flex items-start gap-2.5 border border-line bg-washi/70 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
        <span className="flex flex-col gap-1 text-[12px] leading-relaxed">
          <strong className="font-medium text-ink">{a('notReadyTitle')}</strong>
          <span className="text-ink-muted">{a('notReadyBody')}</span>
        </span>
      </div>

      <form className="flex flex-col gap-4">
        <Field id="name" label={a('name')} autoComplete="name" />
        <Field id="email" label={a('email')} type="email" autoComplete="email" placeholder="you@example.com" />
        <Field id="password" label={a('password')} type="password" autoComplete="new-password" />
        <Field id="country" label={a('country')} autoComplete="country-name" />
        <button
          type="submit"
          disabled
          className={buttonClass('primary', 'lg', 'mt-1 w-full disabled:cursor-not-allowed disabled:opacity-45')}
        >
          {a('submitRegister')}
        </button>
        <p className="text-[11px] leading-relaxed text-ink-muted">
          {a('terms')}{' '}
          <Link href="/legal/terms" className="text-vermilion hover:underline">
            {a('termsLink')}
          </Link>
          {' / '}
          <Link href="/legal/privacy" className="text-vermilion hover:underline">
            {a('privacyLink')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
