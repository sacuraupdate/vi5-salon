import { isEmailConfigured, resendEnv } from '../env';

/**
 * メール送信（Resend）。
 *
 * SDK を入れずに fetch で送る。Cloudflare Workers 上で確実に動かすため。
 *
 * **この関数は例外を投げない。** 決済の Webhook から呼ぶため、
 * メールの失敗で受講権限の付与まで巻き込んで落とさない。
 * 失敗したことは戻り値で伝える。
 */
export type SendResult = { ok: true; id: string } | { ok: false; reason: string };

export type Mail = {
  to: string;
  subject: string;
  /** 本文（プレーンテキスト）。装飾より確実に届くことを優先する */
  text: string;
  replyTo?: string;
};

export async function sendMail(mail: Mail): Promise<SendResult> {
  if (!isEmailConfigured()) {
    return { ok: false, reason: 'メール送信が未設定です（RESEND_API_KEY / EMAIL_FROM）' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendEnv.apiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendEnv.from(),
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, reason: `Resend への送信が失敗しました (${res.status}) ${detail.slice(0, 200)}` };
    }
    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id ?? '' };
  } catch (e) {
    return { ok: false, reason: `メール送信で例外が発生しました: ${String(e).slice(0, 200)}` };
  }
}
