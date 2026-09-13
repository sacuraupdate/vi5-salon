/**
 * 問い合わせ先メールアドレス。
 * ドメイン確定後に NEXT_PUBLIC_SUPPORT_EMAIL を設定すると、
 * 問い合わせページとフッターに自動で表示される。未設定なら「準備中」と出す。
 */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '';
