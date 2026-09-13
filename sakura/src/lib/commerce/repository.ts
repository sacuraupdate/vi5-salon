import type { Consent, CurrencyCode, Entitlement, Locale, MarketId, Purchase, PurchaseStatus } from '../data/types';

/** 購入者アカウント。住所・電話番号は保持しない（海外ユーザーに求めない方針） */
export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  locale: Locale;
  market: MarketId;
};

export type CreateUserInput = {
  email: string;
  name?: string | null;
  country?: string | null;
  locale: Locale;
  market: MarketId;
};

export type CreatePurchaseInput = {
  userId: string;
  courseSlug: string;
  status: PurchaseStatus;
  market: MarketId;
  currency: CurrencyCode;
  amount: number;
  stripeSessionId: string;
  stripePaymentIntent?: string | null;
};

/**
 * 決済・受講権限のデータアクセス。
 *
 * 画面と Webhook はこのインターフェースだけに依存する。
 * Supabase 実装は `supabase-repository.ts`。未接続のときは `index.ts` が null を返す。
 */
export type CommerceRepository = {
  getUserByEmail(email: string): Promise<AppUser | null>;
  /** 既にいればその行を返す。無ければ作る */
  findOrCreateUser(input: CreateUserInput): Promise<AppUser>;

  /**
   * Webhook の重複処理を防ぐ。
   * **同じ Stripe イベントを2回受け取っても、2回目は false を返す。**
   * Stripe は同じイベントを再送することがあるため、ここが冪等性の1段目。
   */
  claimWebhookEvent(eventId: string, type: string): Promise<boolean>;
  markWebhookProcessed(eventId: string, note?: string): Promise<void>;

  /** 既に同じ Checkout Session の購入があれば null（冪等性の2段目） */
  createPurchase(input: CreatePurchaseInput): Promise<Purchase | null>;
  getPurchaseBySessionId(stripeSessionId: string): Promise<Purchase | null>;

  /** 既に権限があれば何もしない（冪等性の3段目） */
  grantEntitlement(userId: string, courseSlug: string, expiresAt?: string | null): Promise<void>;
  listEntitlements(userId: string): Promise<Entitlement[]>;

  /** 解約権の放棄に同意した記録。文言のバージョンを必ず残す */
  recordConsent(consent: Omit<Consent, 'agreedAt'> & { agreedAt?: string }): Promise<void>;

  saveContactMessage(input: {
    name: string;
    email: string;
    topic: string;
    message: string;
    locale: Locale;
    market: MarketId | null;
  }): Promise<void>;
};
