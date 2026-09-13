'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn, signOut, signUp, type AuthSession } from '@/lib/auth';
import {
  ACCESS_TOKEN_COOKIE,
  DEMO_SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIES,
  isSiteDemoMode,
} from '@/lib/session';
import { isAuthConfigured } from '@/lib/env';
import { getCommerce } from '@/lib/commerce';
import { getMarket } from '@/lib/market-server';
import type { Locale } from '@/lib/data';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 自サイト内のパスだけを戻り先として受け付ける（オープンリダイレクト防止） */
function safeNext(next: unknown, locale: string): string {
  const value = typeof next === 'string' ? next : '';
  return value.startsWith('/') && !value.startsWith('//') ? value : `/${locale}/mypage`;
}

/**
 * ログイン状態を Cookie に保存する。
 *
 * - httpOnly：JavaScript から読めない（盗み出されにくくする）
 * - アクセストークンの maxAge を有効期限に合わせる。
 *   期限が来ると Cookie ごと消えるので、proxy がリフレッシュに回せる。
 * - **パスワードは保存しない。** 保存するのは Supabase が発行したトークンだけ。
 */
async function saveSession(session: AuthSession) {
  const store = await cookies();
  const base = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  store.set(ACCESS_TOKEN_COOKIE, session.accessToken, { ...base, maxAge: session.expiresIn });
  store.set(REFRESH_TOKEN_COOKIE, session.refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  store.delete(DEMO_SESSION_COOKIE);
}

async function clearSession() {
  const store = await cookies();
  for (const name of SESSION_COOKIES) store.delete(name);
}

/** 新規登録。パスワードは Supabase Auth へ渡すだけで、アプリ側には保存しない */
export async function signUpAction(formData: FormData) {
  const locale = String(formData.get('locale') ?? 'en') as Locale;
  const email = String(formData.get('email') ?? '').trim().slice(0, 200);
  const password = String(formData.get('password') ?? '');

  if (!EMAIL.test(email)) redirect(`/${locale}/register?error=invalid-email`);
  if (password.length < 8) redirect(`/${locale}/register?error=weak-password`);

  const result = await signUp(email, password);
  if (!result.ok) redirect(`/${locale}/register?error=${result.code}`);

  // メール確認が必要な設定のときは、ここでログイン済みにしない
  if (!result.session) redirect(`/${locale}/register?status=confirm`);

  await linkAndSave(result.session, locale);
  redirect(safeNext(formData.get('next'), locale));
}

/** ログイン */
export async function signInAction(formData: FormData) {
  const locale = String(formData.get('locale') ?? 'en') as Locale;
  const email = String(formData.get('email') ?? '').trim().slice(0, 200);
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'), locale);

  if (!EMAIL.test(email) || password.length === 0) {
    redirect(`/${locale}/login?error=invalid-credentials&next=${encodeURIComponent(next)}`);
  }

  const result = await signIn(email, password);
  if (!result.ok) {
    redirect(`/${locale}/login?error=${result.code}&next=${encodeURIComponent(next)}`);
  }
  if (!result.session) redirect(`/${locale}/login?error=unknown`);

  await linkAndSave(result.session, locale);
  redirect(next);
}

/** Supabase Auth のユーザーとアプリ側の購入者行を結びつけてから、Cookie を保存する */
async function linkAndSave(session: AuthSession, locale: Locale) {
  const commerce = getCommerce();
  if (commerce) {
    try {
      await commerce.findOrCreateUserByAuthId({
        authUserId: session.authUserId,
        email: session.email,
        locale,
        market: await getMarket(locale),
      });
    } catch (e) {
      // 行の作成に失敗してもログインは通す。getSession() 側で次回また作成を試みる
      console.error('[auth] 購入者行の作成に失敗:', e);
    }
  }
  await saveSession(session);
}

/** ログアウト。Supabase 側のセッションも失効させ、Cookie を消す */
export async function signOutAction(formData: FormData) {
  const locale = String(formData.get('locale') ?? 'en');
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) await signOut(accessToken);
  await clearSession();
  redirect(`/${locale}`);
}

/**
 * 確認用セッションの開始。
 * **Supabase Auth が設定されている環境では何もしない**（isSiteDemoMode() が false）。
 * 本番でも常に無効。
 */
export async function startDemoSession(formData: FormData) {
  if (isAuthConfigured() || !isSiteDemoMode()) return;
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, 'demo', { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
  const next = formData.get('next');
  redirect(typeof next === 'string' && next.startsWith('/') ? next : '/');
}
