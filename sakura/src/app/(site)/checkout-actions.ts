'use server';

import { redirect } from 'next/navigation';
import { catalogRepository } from '@/lib/data';
import { getSession } from '@/lib/session';
import { getMarket } from '@/lib/market-server';
import { getCommerce } from '@/lib/commerce';
import { isPurchasable } from '@/lib/format';
import { priceFor } from '@/lib/market';
import { isStripeConfigured } from '@/lib/env';
import { createCheckoutSession } from '@/lib/stripe';
import { CONSENT_VERSION } from '@/lib/consent';
import { SITE_URL } from '@/lib/site';
import type { Locale } from '@/lib/data';

/** 講座ページへ戻し、何が足りなかったかを伝える */
function back(locale: string, slug: string, reason: string): never {
  redirect(`/${locale}/courses/${slug}?checkout=${reason}#purchase`);
}

/**
 * 決済の開始。
 *
 * 次のすべてを満たしたときだけ Stripe の決済ページへ送る：
 *   1. ログインしている
 *   2. その言語で公開され、その市場で販売している講座
 *   3. 価格が確定していて、Stripe の Price ID が登録されている
 *   4. 即時提供への同意にチェックが入っている
 *   5. Stripe とデータベースが接続されている
 *
 * **金額はここでは送らない。** Stripe の Price ID だけを渡し、
 * 実際の請求額は Stripe 側の設定を正とする。
 * 画面から渡された金額を信用すると、値を書き換えられたときに防げないため。
 */
export async function startCheckout(formData: FormData) {
  const slug = String(formData.get('slug') ?? '');
  const locale = String(formData.get('locale') ?? 'en') as Locale;
  if (!slug) redirect(`/${locale}/courses`);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/courses/${slug}`);

  const course = await catalogRepository.getCourse(slug);
  if (!course) redirect(`/${locale}/courses`);

  const market = await getMarket(locale);
  if (!isPurchasable(course, locale, market)) back(locale, slug, 'not-on-sale');

  const price = priceFor(course.pricing, market);
  if (!price?.stripePriceId) back(locale, slug, 'no-price-id');

  if (formData.get('consent') !== 'agreed') back(locale, slug, 'consent-required');

  if (!isStripeConfigured()) back(locale, slug, 'not-configured');
  const commerce = getCommerce();
  if (!commerce) back(locale, slug, 'not-configured');

  const user = await commerce.findOrCreateUser({
    email: session.email,
    locale,
    market,
  });

  let checkoutUrl: string;
  try {
    const created = await createCheckoutSession({
      priceId: price.stripePriceId,
      customerEmail: user.email,
      successUrl: `${SITE_URL}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${SITE_URL}/${locale}/courses/${slug}?checkout=cancelled#purchase`,
      locale,
      metadata: {
        userId: user.id,
        courseSlug: slug,
        market,
        locale,
        consentVersion: CONSENT_VERSION,
      },
    });
    checkoutUrl = created.url;
  } catch (e) {
    console.error('[checkout] 決済ページの作成に失敗:', e);
    back(locale, slug, 'failed');
  }

  // redirect は例外で制御されるため、try の外で呼ぶ
  redirect(checkoutUrl);
}
