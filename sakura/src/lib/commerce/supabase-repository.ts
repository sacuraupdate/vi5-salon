import { supabase } from '../supabase';
import type { Entitlement, Purchase } from '../data/types';
import type { AppUser, CommerceRepository, CreatePurchaseInput, CreateUserInput } from './repository';

/* DB の列名（snake_case）と型の対応。SQL は supabase/migrations/0001_init.sql */

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  locale: string;
  market: string;
};

type PurchaseRow = {
  id: string;
  user_id: string;
  course_slug: string;
  status: string;
  market: string;
  currency: string;
  amount: number | string;
  stripe_session_id: string;
  purchased_at: string;
};

type EntitlementRow = {
  user_id: string;
  course_slug: string;
  granted_at: string;
  expires_at: string | null;
};

const toUser = (r: UserRow): AppUser => ({
  id: r.id,
  email: r.email,
  name: r.name,
  country: r.country,
  locale: r.locale as AppUser['locale'],
  market: r.market as AppUser['market'],
});

const toPurchase = (r: PurchaseRow): Purchase => ({
  id: r.id,
  userId: r.user_id,
  courseSlug: r.course_slug,
  status: r.status as Purchase['status'],
  market: r.market as Purchase['market'],
  currency: r.currency as Purchase['currency'],
  // numeric 列は文字列で返ることがあるため、数値に揃える
  amount: Number(r.amount),
  externalId: r.stripe_session_id,
  purchasedAt: r.purchased_at,
});

export const supabaseCommerce: CommerceRepository = {
  async getUserByEmail(email) {
    const rows = await supabase.select<UserRow>('users', { eq: { email: email.toLowerCase() }, limit: 1 });
    return rows[0] ? toUser(rows[0]) : null;
  },

  async findOrCreateUser(input: CreateUserInput) {
    const email = input.email.toLowerCase();
    const existing = await this.getUserByEmail(email);
    if (existing) return existing;
    const row = await supabase.upsert<UserRow>(
      'users',
      {
        email,
        name: input.name ?? null,
        country: input.country ?? null,
        locale: input.locale,
        market: input.market,
      },
      'email',
    );
    return toUser(row);
  },

  /**
   * 冪等性の1段目。webhook_events の主キーは Stripe のイベントID。
   *
   * 初めて受け取った → true（処理する）
   * 受け取り済みだが処理が完了していない → true（前回失敗なので、やり直す）
   * 処理済み → false（何もしない）
   *
   * 「受け取った時点で打ち切る」とはしていない。そうすると、途中で失敗したときに
   * Stripe が再送しても素通りし、入金済みなのに権限が付かないまま終わるため。
   */
  async claimWebhookEvent(eventId, type) {
    const inserted = await supabase.insertIgnoreDuplicates<{ id: string }>(
      'webhook_events',
      { id: eventId, type },
      'id',
    );
    if (inserted) return true;
    const rows = await supabase.select<{ processed_at: string | null }>('webhook_events', {
      select: 'processed_at',
      eq: { id: eventId },
      limit: 1,
    });
    return rows[0]?.processed_at == null;
  },

  async markWebhookProcessed(eventId, note) {
    await supabase.update('webhook_events', { id: eventId }, {
      processed_at: new Date().toISOString(),
      note: note ?? null,
    });
  },

  /** 冪等性の2段目。stripe_session_id に一意制約があるため、同じ決済は1回しか記録されない */
  async createPurchase(input: CreatePurchaseInput) {
    const row = await supabase.insertIgnoreDuplicates<PurchaseRow>(
      'purchases',
      {
        user_id: input.userId,
        course_slug: input.courseSlug,
        status: input.status,
        market: input.market,
        currency: input.currency,
        amount: input.amount,
        stripe_session_id: input.stripeSessionId,
        stripe_payment_intent: input.stripePaymentIntent ?? null,
        purchased_at: new Date().toISOString(),
      },
      'stripe_session_id',
    );
    return row ? toPurchase(row) : null;
  },

  async getPurchaseBySessionId(stripeSessionId) {
    const rows = await supabase.select<PurchaseRow>('purchases', {
      eq: { stripe_session_id: stripeSessionId },
      limit: 1,
    });
    return rows[0] ? toPurchase(rows[0]) : null;
  },

  /** 冪等性の3段目。(user_id, course_slug) が主キーなので、二重付与にならない */
  async grantEntitlement(userId, courseSlug, expiresAt = null) {
    await supabase.insertIgnoreDuplicates(
      'entitlements',
      {
        user_id: userId,
        course_slug: courseSlug,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      'user_id,course_slug',
    );
  },

  async listEntitlements(userId) {
    const rows = await supabase.select<EntitlementRow>('entitlements', { eq: { user_id: userId } });
    return rows.map<Entitlement>((r) => ({
      userId: r.user_id,
      courseSlug: r.course_slug,
      grantedAt: r.granted_at,
      expiresAt: r.expires_at,
    }));
  },

  async recordConsent(consent) {
    await supabase.insertIgnoreDuplicates(
      'consents',
      {
        user_id: consent.userId,
        purchase_id: consent.purchaseId,
        kind: consent.kind,
        text_version: consent.textVersion,
        locale: consent.locale,
        agreed_at: consent.agreedAt ?? new Date().toISOString(),
      },
      'user_id,purchase_id,kind',
    );
  },

  async saveContactMessage(input) {
    await supabase.upsert(
      'contact_messages',
      {
        name: input.name,
        email: input.email.toLowerCase(),
        topic: input.topic,
        message: input.message,
        locale: input.locale,
        market: input.market,
        status: 'open',
      },
      'id',
    );
  },
};
