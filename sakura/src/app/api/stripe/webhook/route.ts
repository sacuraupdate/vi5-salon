import { NextResponse, type NextRequest } from 'next/server';
import { catalogRepository } from '@/lib/data';
import { getCommerce } from '@/lib/commerce';
import { toDisplayAmount, verifyWebhook } from '@/lib/stripe';
import { sendMail } from '@/lib/email/send';
import { purchaseCompleteMail } from '@/lib/email/templates/purchase-complete';
import { resendEnv } from '@/lib/env';
import { SITE_URL } from '@/lib/site';
import { tc } from '@/lib/format';
import type { CurrencyCode, Locale, MarketId } from '@/lib/data';

/**
 * Stripe からの支払い通知を受け取り、**ここでだけ受講権限を付与する。**
 *
 * 決済成功画面（/checkout/success）では権限を一切付けない。
 * 成功画面のURLは購入者が自由に開けるため、そこで付与すると
 * 支払っていない人に権限を渡してしまうから。
 *
 * 冪等性は3段で担保している：
 *   1. webhook_events（イベントID）… 処理済みのイベントは何もしない
 *   2. purchases.stripe_session_id の一意制約 … 同じ決済は1回しか記録されない
 *   3. entitlements の主キー(user_id, course_slug) … 権限は二重に付かない
 * メールは 2 が「初めて記録した」ときだけ送るため、再送されても二重に届かない。
 */
export const dynamic = 'force-dynamic';

/** Stripe に再試行してほしいときは 5xx、二度と送ってほしくないときは 2xx を返す */
const ok = (note: string) => NextResponse.json({ received: true, note });
const retry = (note: string) => NextResponse.json({ received: false, note }, { status: 500 });

export async function POST(request: NextRequest) {
  // 署名検証には加工前の本文が要る。JSON へ変換する前に読む
  const rawBody = await request.text();
  const verified = await verifyWebhook(rawBody, request.headers.get('stripe-signature'));

  if (!verified.ok) {
    // 検証に失敗したものは絶対に処理しない
    console.error('[stripe-webhook] 署名検証に失敗:', verified.reason);
    return NextResponse.json({ error: verified.reason }, { status: 400 });
  }

  const event = verified.event;
  const commerce = getCommerce();
  if (!commerce) {
    // DB が未接続。入金は済んでいるので、再送してもらう
    console.error('[stripe-webhook] データベースが未接続のため処理できません');
    return retry('データベース未接続');
  }

  if (event.type !== 'checkout.session.completed') {
    return ok(`対象外のイベント: ${event.type}`);
  }

  try {
    if (!(await commerce.claimWebhookEvent(event.id, event.type))) {
      return ok('処理済みのイベント');
    }

    const session = event.data.object as {
      id: string;
      payment_status?: string;
      amount_total?: number;
      currency?: string;
      customer_email?: string | null;
      payment_intent?: string | null;
      customer_details?: { email?: string | null; name?: string | null } | null;
      metadata?: Record<string, string> | null;
    };

    // 支払いが完了していないセッションでは権限を付けない
    if (session.payment_status !== 'paid') {
      await commerce.markWebhookProcessed(event.id, `未払い: ${session.payment_status ?? 'unknown'}`);
      return ok('支払い未完了のため権限は付与しない');
    }

    const meta = session.metadata ?? {};
    const email = session.customer_details?.email ?? session.customer_email ?? '';
    const courseSlug = meta.courseSlug ?? '';
    if (!email || !courseSlug) {
      await commerce.markWebhookProcessed(event.id, 'メールまたは講座が特定できない');
      console.error('[stripe-webhook] metadata が不足:', JSON.stringify(meta));
      return ok('必要な情報が無いため処理しない');
    }

    const locale = (meta.locale ?? 'en') as Locale;
    const market = (meta.market ?? 'global-usd') as MarketId;

    const user = await commerce.findOrCreateUser({
      email,
      name: session.customer_details?.name ?? null,
      locale,
      market,
    });

    // 金額は Stripe から来た値だけを使う。クライアントから渡った値は信用しない
    const currency = (session.currency ?? 'usd').toUpperCase() as CurrencyCode;
    const purchase = await commerce.createPurchase({
      userId: user.id,
      courseSlug,
      status: 'paid',
      market,
      currency,
      amount: toDisplayAmount(session.amount_total ?? 0, session.currency ?? 'usd'),
      stripeSessionId: session.id,
      stripePaymentIntent: session.payment_intent ?? null,
    });

    // 権限の付与。ここは何度呼んでも同じ結果になる
    await commerce.grantEntitlement(user.id, courseSlug, null);

    if (meta.consentVersion) {
      await commerce.recordConsent({
        userId: user.id,
        purchaseId: purchase?.id ?? null,
        kind: 'immediate-access-waiver',
        textVersion: meta.consentVersion,
        locale,
      });
    }

    // 初めて記録できたときだけメールを送る（再送で二重に届かないようにする）
    if (purchase) {
      const course = await catalogRepository.getCourse(courseSlug);
      const title = (course ? tc(course.title, locale) : null) ?? courseSlug;
      const mail = await sendMail(
        purchaseCompleteMail(locale, {
          to: email,
          name: session.customer_details?.name ?? null,
          courseTitle: title,
          learnUrl: `${SITE_URL}/${locale}/learn/${courseSlug}`,
          supportEmail: resendEnv.contactTo(),
        }),
      );
      // メールが送れなくても権限は付いている。失敗は記録だけして処理は成功とする
      if (!mail.ok) console.error('[stripe-webhook] 購入完了メールの送信に失敗:', mail.reason);
    }

    await commerce.markWebhookProcessed(event.id, purchase ? '権限を付与' : '権限は付与済み');
    return ok('完了');
  } catch (e) {
    // 失敗したイベントは processed_at が空のまま残るので、Stripe の再送で再処理される
    console.error('[stripe-webhook] 処理中に例外:', e);
    return retry('処理に失敗したため再送を要求');
  }
}
