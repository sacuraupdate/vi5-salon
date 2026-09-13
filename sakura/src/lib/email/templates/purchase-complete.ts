import type { Locale } from '../../data/types';
import type { Mail } from '../send';

/**
 * 購入完了メール。
 *
 * **購入者が選んだ言語で送る。** 英語で購入した人に日本語のメールを送らない。
 * 未対応の言語があっても日本語へ落とさず、英語を使う（`resolveMailLocale`）。
 *
 * 装飾の無いプレーンテキストにしてある。迷惑メール判定を避け、
 * どの端末でも確実に読めることを優先した。
 */
export type PurchaseMailInput = {
  to: string;
  name: string | null;
  courseTitle: string;
  /** 受講画面への絶対URL */
  learnUrl: string;
  /** 問い合わせ先。未設定なら省略する */
  supportEmail: string;
};

/** メールの言語。日本語へは落とさず、未対応は英語にする */
export function resolveMailLocale(locale: string): Locale {
  return (['en', 'ja', 'ko', 'zh-TW'] as const).includes(locale as Locale) ? (locale as Locale) : 'en';
}

const body = (locale: Locale, i: PurchaseMailInput): { subject: string; text: string } => {
  const hello = i.name ? i.name : '';
  const support = (label: string) => (i.supportEmail ? `\n${label} ${i.supportEmail}\n` : '\n');

  switch (locale) {
    case 'ja':
      return {
        subject: `【SAKURA JAPAN BEAUTY】ご購入ありがとうございます：${i.courseTitle}`,
        text: [
          `${hello ? `${hello} 様` : 'お客様'}`,
          '',
          'このたびはご購入いただきありがとうございます。',
          `ご購入いただいた講座：${i.courseTitle}`,
          '',
          'こちらから受講を開始できます：',
          i.learnUrl,
          '',
          '・視聴期限はありません。何度でもご覧いただけます。',
          '・あとから追加される章も、追加料金なしでご覧いただけます。',
          '・PDF教材は公開後、何度でもダウンロードいただけます。',
          support('ご不明な点は次のメールアドレスまでご連絡ください：'),
          'SAKURA JAPAN BEAUTY',
        ].join('\n'),
      };
    case 'ko':
      return {
        subject: `[SAKURA JAPAN BEAUTY] 구매해 주셔서 감사합니다: ${i.courseTitle}`,
        text: [
          `${hello ? `${hello} 님` : '고객님'}`,
          '',
          '구매해 주셔서 감사합니다.',
          `구매하신 강좌: ${i.courseTitle}`,
          '',
          '아래에서 수강을 시작하실 수 있습니다:',
          i.learnUrl,
          '',
          '· 시청 기한이 없습니다. 몇 번이든 보실 수 있습니다.',
          '· 나중에 추가되는 챕터도 추가 비용 없이 보실 수 있습니다.',
          '· PDF 자료는 공개 후 몇 번이든 다운로드하실 수 있습니다.',
          support('궁금한 점은 아래 주소로 연락해 주세요:'),
          'SAKURA JAPAN BEAUTY',
        ].join('\n'),
      };
    case 'zh-TW':
      return {
        subject: `【SAKURA JAPAN BEAUTY】感謝您的購買：${i.courseTitle}`,
        text: [
          `${hello ? `${hello} 您好` : '您好'}`,
          '',
          '感謝您的購買。',
          `您購買的課程：${i.courseTitle}`,
          '',
          '可以從這裡開始觀看：',
          i.learnUrl,
          '',
          '・沒有觀看期限，可以反覆觀看。',
          '・日後新增的章節也不需額外費用。',
          '・PDF 教材公開後可無限次下載。',
          support('如有任何問題，請聯絡：'),
          'SAKURA JAPAN BEAUTY',
        ].join('\n'),
      };
    default:
      return {
        subject: `Thank you for your purchase: ${i.courseTitle}`,
        text: [
          `${hello ? `Hi ${hello},` : 'Hello,'}`,
          '',
          'Thank you for your purchase.',
          `Course: ${i.courseTitle}`,
          '',
          'You can start watching here:',
          i.learnUrl,
          '',
          '- There is no expiry. Watch as many times as you like.',
          '- Chapters added later are included at no extra cost.',
          '- PDF materials can be downloaded as often as you like once released.',
          support('If anything is unclear, write to us at:'),
          'SAKURA JAPAN BEAUTY',
        ].join('\n'),
      };
  }
};

export function purchaseCompleteMail(locale: string, input: PurchaseMailInput): Mail {
  const { subject, text } = body(resolveMailLocale(locale), input);
  return { to: input.to, subject, text, ...(input.supportEmail ? { replyTo: input.supportEmail } : {}) };
}
