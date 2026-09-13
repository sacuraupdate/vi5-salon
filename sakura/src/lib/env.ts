/**
 * 外部サービスの接続情報。**秘密情報をコードに書かない。**
 *
 * すべて環境変数から読む。未設定でもアプリは起動し、その機能だけが無効になる。
 * どの変数をどこから取得するかは `docs/env-setup.md` を参照。
 *
 * NEXT_PUBLIC_ が付いた変数はブラウザにも渡る。秘密鍵には絶対に付けないこと。
 */

const read = (name: string): string => process.env[name] ?? '';

/* ---------- Stripe（決済） ---------- */

export const stripeEnv = {
  /** sk_test_... / sk_live_...。**絶対にブラウザへ渡さない** */
  secretKey: () => read('STRIPE_SECRET_KEY'),
  /** whsec_...。Webhook の署名検証に使う */
  webhookSecret: () => read('STRIPE_WEBHOOK_SECRET'),
};

export function isStripeConfigured(): boolean {
  return stripeEnv.secretKey().startsWith('sk_');
}

export function isStripeWebhookConfigured(): boolean {
  return stripeEnv.webhookSecret().startsWith('whsec_');
}

/* ---------- Supabase（データベース） ---------- */

export const supabaseEnv = {
  url: () => read('SUPABASE_URL'),
  /** service_role キー。全権限を持つ。**絶対にブラウザへ渡さない** */
  serviceRoleKey: () => read('SUPABASE_SERVICE_ROLE_KEY'),
  /**
   * anon キー。ログイン・新規登録（Supabase Auth）に使う。
   * 公開しても構わない種類の鍵だが、認証はすべてサーバー側で行うため
   * NEXT_PUBLIC_ を付けずブラウザへは渡していない。
   */
  anonKey: () => read('SUPABASE_ANON_KEY'),
};

export function isSupabaseConfigured(): boolean {
  return supabaseEnv.url().startsWith('https://') && supabaseEnv.serviceRoleKey().length > 20;
}

/** ログイン・新規登録が使えるか。DB と anon キーの両方が要る */
export function isAuthConfigured(): boolean {
  return isSupabaseConfigured() && supabaseEnv.anonKey().length > 20;
}

/* ---------- Resend（メール送信） ---------- */

export const resendEnv = {
  apiKey: () => read('RESEND_API_KEY'),
  /** 送信元。例: SAKURA JAPAN BEAUTY <no-reply@example.com> */
  from: () => read('EMAIL_FROM'),
  /** 問い合わせの転送先。未設定なら NEXT_PUBLIC_SUPPORT_EMAIL を使う */
  contactTo: () => read('CONTACT_TO_EMAIL') || read('NEXT_PUBLIC_SUPPORT_EMAIL'),
};

export function isEmailConfigured(): boolean {
  return resendEnv.apiKey().startsWith('re_') && resendEnv.from().includes('@');
}

/* ---------- 検索エンジンへの公開 ---------- */

/**
 * 検索エンジンに載せてよいか。
 *
 * **既定は「載せない」。** 販売開始前のサイトが検索結果に出ると、
 * 「準備中」だらけのページが先に見つかってしまい、あとから直しにくい。
 * Stripe の審査担当者はURLを直接開くため、この設定の影響を受けない。
 *
 * 実際に販売を開始する日に SITE_INDEXABLE=true を設定する。
 */
export function isSiteIndexable(): boolean {
  return process.env.SITE_INDEXABLE === 'true';
}

/**
 * 接続状況のまとめ。管理画面の「システム状況」に出して、
 * SAKURA が設定漏れに日本語で気づけるようにする。
 */
export type IntegrationStatus = {
  key: 'stripe' | 'stripeWebhook' | 'supabase' | 'auth' | 'email' | 'indexing';
  label: string;
  ready: boolean;
  /** 未設定のときに何をすればよいか（日本語） */
  todo: string;
};

export function integrationStatuses(): IntegrationStatus[] {
  return [
    {
      key: 'indexing',
      label: '検索エンジンへの掲載',
      ready: isSiteIndexable(),
      todo: '販売を開始する日に SITE_INDEXABLE=true を設定してください。それまでは検索結果に出ません（意図した動作です）。',
    },
    {
      key: 'supabase',
      label: 'データベース（Supabase）',
      ready: isSupabaseConfigured(),
      todo: 'SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。',
    },
    {
      key: 'auth',
      label: 'ログイン・新規登録（Supabase Auth）',
      ready: isAuthConfigured(),
      todo: 'SUPABASE_ANON_KEY を設定してください。これが無いとお客様はログインも購入もできません。',
    },
    {
      key: 'stripe',
      label: '決済（Stripe）',
      ready: isStripeConfigured(),
      todo: 'STRIPE_SECRET_KEY を設定してください。',
    },
    {
      key: 'stripeWebhook',
      label: '決済の通知（Stripe Webhook）',
      ready: isStripeWebhookConfigured(),
      todo: 'STRIPE_WEBHOOK_SECRET を設定してください。これが無いと購入しても受講権限が付きません。',
    },
    {
      key: 'email',
      label: 'メール送信（Resend）',
      ready: isEmailConfigured(),
      todo: 'RESEND_API_KEY と EMAIL_FROM を設定してください。',
    },
  ];
}
