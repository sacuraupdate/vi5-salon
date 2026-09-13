import { isAuthConfigured, supabaseEnv } from './env';

/**
 * Supabase Auth（GoTrue）への接続。
 *
 * SDK を入れずに fetch で呼ぶ。Cloudflare Workers 上で確実に動かすため。
 *
 * 重要な前提：
 * - **パスワードは Supabase Auth が持つ。アプリ側の DB には保存しない。**
 *   このファイルはパスワードを受け取って Supabase へ渡すだけで、どこにも書き出さない。
 * - すべてサーバー側から呼ぶ。anon キーもブラウザへは渡していない。
 */

/** 画面に出す文言を言語ごとに出し分けるため、原因を型で持つ */
export type AuthErrorCode =
  | 'not-configured'
  | 'invalid-credentials'
  | 'email-taken'
  | 'weak-password'
  | 'invalid-email'
  | 'rate-limited'
  | 'unknown';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  /** アクセストークンの有効期間（秒） */
  expiresIn: number;
  authUserId: string;
  email: string;
};

export type AuthResult =
  | { ok: true; session: AuthSession }
  /** 登録はできたが、メールの確認が終わるまでログインできない状態 */
  | { ok: true; session: null; needsEmailConfirmation: true }
  | { ok: false; code: AuthErrorCode };

type GoTrueUser = { id: string; email?: string | null };
type GoTrueSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: GoTrueUser;
  id?: string;
  email?: string | null;
};

function headers(accessToken?: string): Record<string, string> {
  return {
    apikey: supabaseEnv.anonKey(),
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

const endpoint = (path: string) => `${supabaseEnv.url().replace(/\/$/, '')}/auth/v1${path}`;

/** GoTrue のエラー本文から原因を判定する。文言は画面側で言語ごとに出す */
function classify(status: number, body: string): AuthErrorCode {
  const text = body.toLowerCase();
  if (status === 429) return 'rate-limited';
  if (text.includes('already registered') || text.includes('already been registered')) return 'email-taken';
  if (text.includes('password should be') || text.includes('weak')) return 'weak-password';
  if (text.includes('invalid login credentials') || text.includes('invalid_grant')) return 'invalid-credentials';
  if (text.includes('unable to validate email') || text.includes('invalid format')) return 'invalid-email';
  if (status === 400 || status === 401) return 'invalid-credentials';
  return 'unknown';
}

function toSession(json: GoTrueSession): AuthSession | null {
  const user = json.user ?? (json.id ? { id: json.id, email: json.email } : null);
  if (!json.access_token || !json.refresh_token || !user?.id) return null;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in ?? 3600,
    authUserId: user.id,
    email: user.email ?? '',
  };
}

/** 新規登録。メール確認が必要な設定なら session は null で返る */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (!isAuthConfigured()) return { ok: false, code: 'not-configured' };

  const res = await fetch(endpoint('/signup'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, code: classify(res.status, body) };

  const session = toSession(JSON.parse(body) as GoTrueSession);
  // トークンが返らない＝メール確認待ち。ここでログイン済みにしない
  return session ? { ok: true, session } : { ok: true, session: null, needsEmailConfirmation: true };
}

/** ログイン */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isAuthConfigured()) return { ok: false, code: 'not-configured' };

  const res = await fetch(endpoint('/token?grant_type=password'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, code: classify(res.status, body) };

  const session = toSession(JSON.parse(body) as GoTrueSession);
  return session ? { ok: true, session } : { ok: false, code: 'unknown' };
}

/** アクセストークンの期限切れ後、リフレッシュトークンで取り直す */
export async function refresh(refreshToken: string): Promise<AuthSession | null> {
  if (!isAuthConfigured()) return null;
  try {
    const res = await fetch(endpoint('/token?grant_type=refresh_token'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return toSession((await res.json()) as GoTrueSession);
  } catch {
    return null;
  }
}

/**
 * アクセストークンが本物か、Supabase に問い合わせて確かめる。
 *
 * 署名を自前で検証せず毎回問い合わせているのは、
 * 署名方式（HS256 / ES256）がプロジェクトによって違い、
 * 取り消されたトークンもここで確実に弾けるため。
 */
export async function getAuthUser(accessToken: string): Promise<{ id: string; email: string } | null> {
  if (!isAuthConfigured() || !accessToken) return null;
  try {
    const res = await fetch(endpoint('/user'), { headers: headers(accessToken), cache: 'no-store' });
    if (!res.ok) return null;
    const user = (await res.json()) as GoTrueUser;
    return user?.id ? { id: user.id, email: user.email ?? '' } : null;
  } catch {
    return null;
  }
}

/** ログアウト。Supabase 側のセッションも失効させる */
export async function signOut(accessToken: string): Promise<void> {
  if (!isAuthConfigured() || !accessToken) return;
  try {
    await fetch(endpoint('/logout'), { method: 'POST', headers: headers(accessToken) });
  } catch {
    // 失効に失敗しても、こちら側の Cookie は消す（呼び出し側で処理）
  }
}
