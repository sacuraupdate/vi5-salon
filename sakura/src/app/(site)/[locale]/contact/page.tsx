import type { Metadata } from 'next';
import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/site';
import { SUPPORT_EMAIL } from '@/lib/support';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/public/AuthShell';
import { buttonClass } from '@/components/ui/Button';
import { isContactEnabled, submitContact } from '@/app/(site)/contact-actions';

/** 送信先の設定を実行時に見るため、静的生成しない */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: c('title'),
    description: c('lead'),
    alternates: alternatesFor(locale, '/contact'),
  };
}

/**
 * 問い合わせ。海外ユーザーが困ったときの行き先を必ず1つ用意する。
 * 電話番号・住所は求めない。送信手段（メール配信）が未接続の間は、
 * フォームを動くふりをさせず、直接のメール連絡先を主導線にする。
 */
export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);
  const c = await getTranslations({ locale, namespace: 'contact' });
  const enabled = await isContactEnabled();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <h1 className="font-serif text-[24px] leading-relaxed text-ink">{c('title')}</h1>
      <p className="mt-3 text-sm leading-loose text-ink-muted">{c('lead')}</p>

      {/* いま確実に使える連絡手段を先に置く */}
      <Card className="mt-6 p-5">
        <h2 className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <Mail className="h-4 w-4 text-vermilion" strokeWidth={1.5} />
          {c('directTitle')}
        </h2>
        {SUPPORT_EMAIL ? (
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-2 inline-block font-mono text-[14px] break-all text-vermilion hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        ) : (
          <p className="mt-2 text-[13px] text-ink-muted">{c('emailPending')}</p>
        )}
        <p className="mt-2 text-[12px] text-ink-muted">{c('responseNote')}</p>
      </Card>

      {status === 'sent' ? (
        <Card className="mt-6 border-pine/40 bg-pine/5 p-4">
          <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pine" strokeWidth={1.5} />
            <span>
              <strong className="font-medium">{c('sentTitle')}</strong>
              <br />
              {c('sentBody')}
            </span>
          </p>
        </Card>
      ) : null}
      {status === 'invalid' || status === 'failed' ? (
        <Card className="mt-6 border-vermilion/40 bg-vermilion/5 p-4">
          <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
            {status === 'invalid' ? c('errorInvalid') : c('errorFailed')}
          </p>
        </Card>
      ) : null}

      <form action={submitContact} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <Field id="name" name="name" label={c('name')} autoComplete="name" required />
        <Field
          id="email"
          name="email"
          label={c('email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="topic" className="text-[13px] text-ink-2">
            {c('topic')}
          </label>
          <select
            id="topic"
            name="topic"
            className="min-h-[44px] border border-line bg-bg px-3 py-2 text-[14px] text-ink"
          >
            <option value="purchase">{c('topicPurchase')}</option>
            <option value="payment">{c('topicPayment')}</option>
            <option value="access">{c('topicAccess')}</option>
            <option value="other">{c('topicOther')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="message" className="text-[13px] text-ink-2">
            {c('message')}
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            minLength={5}
            placeholder={c('messagePlaceholder')}
            className="border border-line bg-bg px-3 py-2 text-[14px] leading-relaxed text-ink"
          />
        </div>

        {/* 送信先が未設定のときは、押せるように見せて失敗させない */}
        {enabled ? null : (
          <div className="border border-line bg-washi/60 p-4">
            <p className="text-[13px] font-medium text-ink">{c('unavailableTitle')}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{c('unavailableBody')}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={!enabled}
          className={buttonClass('primary', 'lg', 'w-full disabled:cursor-not-allowed disabled:opacity-45')}
        >
          {c('submit')}
        </button>

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>
            {c('noPhoneNote')} {c('privacyNote')}
          </span>
        </p>
      </form>
    </div>
  );
}
