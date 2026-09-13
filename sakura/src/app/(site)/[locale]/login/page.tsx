import { Info } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell, { Field } from '@/components/public/AuthShell';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { isSiteDemoMode } from '@/lib/session';
import { startDemoSession } from '@/app/(site)/actions';

/** 確認用フラグを実行時に読むため、静的生成しない（本番で確認用の導線を出さない） */
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const a = await getTranslations({ locale, namespace: 'auth' });
  const demo = isSiteDemoMode();
  // オープンリダイレクト防止：自サイト内のパスだけ受け付ける
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : `/${locale}/mypage`;

  return (
    <AuthShell
      title={a('loginTitle')}
      lead={a('loginLead')}
      brandCopy={a('brandCopy')}
      demoNote={a('demoNote')}
      footer={
        <p className="flex flex-wrap items-center gap-2 text-ink-muted">
          {a('toRegister')}
          <Link href="/register" className="text-vermilion hover:underline">
            {a('registerTitle')}
          </Link>
        </p>
      }
    >
      {/* 認証は未実装。押せば入れるように見せない */}
      <div className="mb-5 flex items-start gap-2.5 border border-line bg-washi/70 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
        <span className="flex flex-col gap-1 text-[12px] leading-relaxed">
          <strong className="font-medium text-ink">{a('notReadyTitle')}</strong>
          <span className="text-ink-muted">{a('notReadyBody')}</span>
          <Link href="/contact" className="text-vermilion hover:underline">
            {a('forgot')}
          </Link>
        </span>
      </div>

      <form className="flex flex-col gap-4">
        <Field id="email" label={a('email')} type="email" autoComplete="email" placeholder="you@example.com" />
        <Field id="password" label={a('password')} type="password" autoComplete="current-password" />
        <button
          type="submit"
          disabled
          className={buttonClass('primary', 'lg', 'mt-1 w-full disabled:cursor-not-allowed disabled:opacity-45')}
        >
          {a('submitLogin')}
        </button>
      </form>

      {demo ? (
        // 開発・確認環境だけに出る。本番では isSiteDemoMode() が false のため描画されない
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
