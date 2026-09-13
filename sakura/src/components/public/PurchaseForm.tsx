import { AlertCircle, Lock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { startCheckout } from '@/app/(site)/checkout-actions';
import { CONSENT_VERSION, consentLabel, consentNote } from '@/lib/consent';
import { tc } from '@/lib/format';
import { buttonClass } from '@/components/ui/Button';
import type { Locale } from '@/lib/data';

/**
 * 購入フォーム。
 *
 * 「即時提供への同意」にチェックが入らないと送信できない。
 * これは EU・英国などの解約権に対応するためで、同意した文言のバージョン
 * （CONSENT_VERSION）を Stripe の metadata 経由で購入記録に残す。
 *
 * **文言そのものは確定前のドラフト（`src/lib/consent.ts`）。**
 * 専門家の確認後に差し替える。実装側はそのまま使える。
 */
export default async function PurchaseForm({
  slug,
  locale,
  canBuy,
  checkoutReady,
  error,
}: {
  slug: string;
  locale: Locale;
  /** その言語・市場で販売しているか */
  canBuy: boolean;
  /** Stripe の Price ID まで揃っていて、実際に決済に進めるか */
  checkoutReady: boolean;
  /** 直前の操作で戻ってきた理由 */
  error?: string;
}) {
  const c = await getTranslations({ locale, namespace: 'checkout' });
  const d = await getTranslations({ locale, namespace: 'courseDetail' });

  const errorKey: Record<string, string> = {
    'not-on-sale': 'errorNotOnSale',
    'no-price-id': 'errorNoPriceId',
    'consent-required': 'errorConsent',
    'not-configured': 'errorNotConfigured',
    failed: 'errorFailed',
    cancelled: 'errorCancelled',
  };
  const message = error && errorKey[error] ? c(errorKey[error]) : null;

  // 販売していない、または決済の準備ができていない場合は押せないようにする
  const disabled = !canBuy || !checkoutReady;

  return (
    <form action={startCheckout} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="consentVersion" value={CONSENT_VERSION} />

      {message ? (
        <p className="flex items-start gap-2 border border-vermilion/40 bg-vermilion/5 p-3 text-[12px] leading-relaxed text-ink">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermilion" strokeWidth={1.5} />
          {message}
        </p>
      ) : null}

      {canBuy ? (
        <label className="flex cursor-pointer items-start gap-2.5 border border-line p-3 text-[12px] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            name="consent"
            value="agreed"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-vermilion)]"
          />
          <span>
            {tc(consentLabel, locale)}
            <span className="mt-1 block text-[11px] text-ink-muted">{tc(consentNote, locale)}</span>
          </span>
        </label>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className={buttonClass('primary', 'lg', 'w-full disabled:cursor-not-allowed disabled:opacity-45')}
      >
        {disabled ? d('buyPreparing') : c('buy')}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-ink-muted">
        {disabled ? null : <Lock className="h-3 w-3 shrink-0" strokeWidth={1.5} />}
        {disabled ? d('buyPreparingNote') : d('buyNote')}
      </p>
    </form>
  );
}
