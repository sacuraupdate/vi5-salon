import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell, { Field } from '@/components/public/AuthShell';
import AuthNotice from '@/components/public/AuthNotice';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { isAuthConfigured } from '@/lib/env';
import { isSiteDemoMode } from '@/lib/session';
import { signInAction, startDemoSession } from '@/app/(site)/auth-actions';

/** 接続状況を実行時に読むため、静的生成しない */
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string; status?: string }>;
}) {
  const { locale } = await params;
  const { next, error, status } = await searchParams;
  setRequestLocale(locale);
  const a = await getTranslations({ locale, namespace: 'auth' });

  const ready = isAuthConfigured();
  const demo = isSiteDemoMode();
  // オープンリダイレクト防止：自サイト内のパスだけ受け付ける
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : `/${locale}/mypage`;

  return (
    <AuthShell
      title={a('loginTitle')}
      lead={a('loginLead')}
      brandCopy={a('brandCopy')}
      demoNote={ready ? '' : a('demoNote')}
      footer={
        <p className="flex flex-wrap items-center gap-2 text-ink-muted">
          {a('toRegister')}
          <Link href="/register" className="text-vermilion hover:underline">
            {a('registerTitle')}
          </Link>
        </p>
      }
    >
      <AuthNotice locale={locale} error={error} status={status} />

      {ready ? null : (
        <div className="mb-5 border border-line bg-washi/70 p-4 text-[12px] leading-relaxed">
          <strong className="font-medium text-ink">{a('notReadyTitle')}</strong>
          <span className="mt-1 block text-ink-muted">{a('notReadyBody')}</span>
        </div>
      )}

      <form action={signInAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={safeNext} />
        <Field
          id="email"
          label={a('email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <Field id="password" label={a('password')} type="password" autoComplete="current-password" required />
        <button
          type="submit"
          disabled={!ready}
          className={buttonClass('primary', 'lg', 'mt-1 w-full disabled:cursor-not-allowed disabled:opacity-45')}
        >
          {a('submitLogin')}
        </button>
      </form>

      {demo ? (
        // 認証が未設定の開発・確認環境だけに出る。本番・接続後は描画されない
        <form action={startDemoSession} className="mt-6 border-t border-line pt-5">
          <input type="hidden" name="next" value={safeNext} />
          <button type="submit" className={buttonClass('secondary', 'md', 'w-full')}>
            {a('demoEnter')}
          </button>
          <p className="mt-2 text-center text-[11px] text-ink-muted">{a('demoEnterNote')}</p>
        </form>
      ) : null}
    </AuthShell>
  );
}
