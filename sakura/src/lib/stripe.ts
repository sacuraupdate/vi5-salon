import { stripeEnv } from './env';
import type { Locale } from './data/types';

/**
 * Stripe への接続。
 *
 * 公式 SDK を入れていないのは、Cloudflare Workers 上で確実に動かすため。
 * 使うのは「Checkout Session の作成」と「Webhook の署名検証」の2つだけで、
 * どちらも fetch と Web Crypto で足りる。
 *
 * **秘密鍵はこのファイルの外に出さない。ブラウザへ渡さない。**
 */

const API = 'https://api.stripe.com/v1';

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

/** Stripe Checkout が対応している言語へ寄せる。未対応なら自動判定に任せる */
const checkoutLocale: Record<Locale, string> = {
  ja: 'ja',
  en: 'en',
  ko: 'ko',
  'zh-TW': 'zh-TW',
};

export type CreateCheckoutInput = {
  /** Stripe の Price ID（price_...）。金額はここで決まる */
  priceId: string;
  /** 購入者のメール。Checkout 画面に初期表示される */
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  locale: Locale;
  /**
   * Webhook で受け取りたい情報。
   * **金額はここに入れない。** 金額は Stripe 側の Price が正であり、
   * クライアントから渡った値を信用して権限を付けないため。
   */
  metadata: {
    userId: string;
    courseSlug: string;
    market: string;
    locale: Locale;
    /** 同意した文言のバージョン。解約権の放棄の証跡として残す */
    consentVersion: string;
  };
};

/** Checkout Session を作り、決済ページのURLを返す */
export async function createCheckoutSession(input: CreateCheckoutInput): Promise<{ url: string; id: string }> {
  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': input.priceId,
    'line_items[0][quantity]': '1',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    client_reference_id: input.metadata.userId,
    locale: checkoutLocale[input.locale] ?? 'auto',
    // 領収書を購入者の手元に残す
    'payment_intent_data[receipt_email]': input.customerEmail,
  });
  for (const [k, v] of Object.entries(input.metadata)) body.set(`metadata[${k}]`, String(v));

  const res = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeEnv.secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      // 同じ購入操作を二重に作らない
      'Idempotency-Key': `${input.metadata.userId}:${input.metadata.courseSlug}:${input.priceId}`,
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new StripeError('決済ページの作成に失敗しました', res.status, detail.slice(0, 500));
  }
  const json = (await res.json()) as { id: string; url: string | null };
  if (!json.url) throw new StripeError('決済ページのURLが返りませんでした', 502, json.id);
  return { url: json.url, id: json.id };
}

/* ---------- Webhook の署名検証 ---------- */

const encoder = new TextEncoder();

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 長さと内容を時間差なく比べる（タイミング攻撃を避ける） */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type VerifyResult =
  | { ok: true; event: StripeEvent }
  | { ok: false; reason: string };

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

/**
 * Stripe からの通知が本物か確かめる。
 *
 * - `Stripe-Signature` は `t=タイムスタンプ,v1=署名` の形。
 * - 署名は `タイムスタンプ.本文` を Webhook 署名シークレットで HMAC-SHA256 したもの。
 * - **本文は加工前の生テキストでなければならない**（JSON に直すと署名が合わなくなる）。
 * - 古いリクエストの使い回しを防ぐため、既定で5分より古いものは受け取らない。
 *
 * 検証に失敗したものは絶対に処理しない。ここが決済の入口の防御。
 */
export async function verifyWebhook(
  rawBody: string,
  signatureHeader: string | null,
  toleranceSeconds = 300,
  now = Math.floor(Date.now() / 1000),
): Promise<VerifyResult> {
  const secret = stripeEnv.webhookSecret();
  if (!secret) return { ok: false, reason: 'STRIPE_WEBHOOK_SECRET が設定されていません' };
  if (!signatureHeader) return { ok: false, reason: '署名ヘッダーがありません' };

  let timestamp = '';
  const signatures: string[] = [];
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=', 2);
    if (key?.trim() === 't') timestamp = value ?? '';
    if (key?.trim() === 'v1' && value) signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return { ok: false, reason: '署名ヘッダーの形式が不正です' };

  const age = now - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > toleranceSeconds) {
    return { ok: false, reason: `署名の時刻が古すぎます（${age}秒）` };
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`)));
  if (!signatures.some((s) => timingSafeEqual(s, expected))) {
    return { ok: false, reason: '署名が一致しません' };
  }

  try {
    return { ok: true, event: JSON.parse(rawBody) as StripeEvent };
  } catch {
    return { ok: false, reason: '本文を解釈できませんでした' };
  }
}

/**
 * Stripe の金額は最小通貨単位で届く（USD なら セント）。
 * ただし日本円・韓国ウォンのように小数を持たない通貨は、そのままの値で届く。
 * 表示・保存はどの通貨も「表示単位」に揃える。
 */
const ZERO_DECIMAL = new Set(['jpy', 'krw', 'vnd', 'clp', 'xof', 'xaf', 'bif', 'djf', 'gnf', 'kmf', 'mga', 'pyg', 'rwf', 'ugx', 'vuv', 'xpf']);

export function toDisplayAmount(minorAmount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toLowerCase()) ? minorAmount : Math.round(minorAmount) / 100;
}
