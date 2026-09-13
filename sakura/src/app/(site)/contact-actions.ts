'use server';

import { redirect } from 'next/navigation';
import { getCommerce } from '@/lib/commerce';
import { getMarket } from '@/lib/market-server';
import { sendMail } from '@/lib/email/send';
import { isEmailConfigured, isSupabaseConfigured, resendEnv } from '@/lib/env';
import type { Locale } from '@/lib/data';

/** フォームから送れる状態か。どちらも無ければメールで直接連絡してもらう */
export async function isContactEnabled(): Promise<boolean> {
  return isSupabaseConfigured() || (isEmailConfigured() && resendEnv.contactTo().includes('@'));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 問い合わせの送信。
 *
 * 保存とメール通知の両方を試し、**どちらか成功すれば受け付けたとみなす。**
 * 片方が落ちていても問い合わせを取りこぼさないため。
 * 電話番号・住所は受け取らない。
 */
export async function submitContact(formData: FormData) {
  const locale = String(formData.get('locale') ?? 'en') as Locale;
  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const email = String(formData.get('email') ?? '').trim().slice(0, 200);
  const topic = String(formData.get('topic') ?? 'other').slice(0, 40);
  const message = String(formData.get('message') ?? '').trim().slice(0, 4000);

  if (!name || !EMAIL.test(email) || message.length < 5) {
    redirect(`/${locale}/contact?status=invalid`);
  }

  const market = await getMarket(locale);
  let saved = false;

  const commerce = getCommerce();
  if (commerce) {
    try {
      await commerce.saveContactMessage({ name, email, topic, message, locale, market });
      saved = true;
    } catch (e) {
      console.error('[contact] 保存に失敗:', e);
    }
  }

  const to = resendEnv.contactTo();
  if (isEmailConfigured() && to.includes('@')) {
    // 管理側が読むメールなので日本語で書く（CLAUDE.md 第3章）
    const result = await sendMail({
      to,
      subject: `【お問い合わせ】${topic} / ${name}`,
      text: [
        `言語：${locale}`,
        `市場：${market}`,
        `お名前：${name}`,
        `メール：${email}`,
        `ご用件：${topic}`,
        '',
        message,
        '',
        '※ このメールに返信すると、お客様へ直接届きます。',
      ].join('\n'),
      replyTo: email,
    });
    if (result.ok) saved = true;
    else console.error('[contact] 通知メールの送信に失敗:', result.reason);
  }

  redirect(`/${locale}/contact?status=${saved ? 'sent' : 'failed'}`);
}
