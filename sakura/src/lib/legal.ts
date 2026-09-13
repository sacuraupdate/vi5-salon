import type { Localized } from './data/types';

/**
 * 法務ページの本文（実装用ドラフト）。
 *
 * 【重要】この内容は確定していません。
 * - 販売開始前に SAKURA と専門家の確認を受けて確定させること。
 * - 「［要確定］/ [TO BE CONFIRMED]」は SAKURA が決める項目。
 * - 「［要専門家確認］/ [NEEDS LEGAL REVIEW]」は法律の専門家の確認が要る項目。
 *
 * 韓国語・繁体字中国語は未翻訳。顧客には日本語へ落とさず、
 * 「この言語では未提供・英語版を参照」と明示する（`legal.notTranslated*`）。
 */
export const LEGAL_DOCS = ['terms', 'privacy', 'refund', 'tokusho'] as const;
export type LegalDocId = (typeof LEGAL_DOCS)[number];

export type LegalSection = { heading: Localized; body: Localized };
export type LegalDoc = {
  id: LegalDocId;
  /** 最終更新日。確定後に更新する */
  updated: string;
  sections: LegalSection[];
};

/** 翻訳済みの言語だけを返す。未翻訳は英語版へ誘導する */
export const LEGAL_TRANSLATED = ['ja', 'en'] as const;
export function isLegalTranslated(locale: string): boolean {
  return (LEGAL_TRANSLATED as readonly string[]).includes(locale);
}

const s = (hJa: string, hEn: string, bJa: string, bEn: string): LegalSection => ({
  heading: { ja: hJa, en: hEn },
  body: { ja: bJa, en: bEn },
});

export const legalDocs: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: 'terms',
    updated: '2026-09-13',
    sections: [
      s('1. この規約について', '1. About these terms',
        'この規約は、SAKURA JAPAN BEAUTY（以下「当サービス」）が提供するオンライン講座の利用条件を定めるものです。ご購入いただいた時点で、この規約に同意いただいたものとします。',
        'These terms set out the conditions for using the online courses provided by SAKURA JAPAN BEAUTY (“the Service”). By purchasing, you agree to them.'),
      s('2. 販売するもの', '2. What we sell',
        '当サービスが販売するのはデジタルの教育コンテンツ（動画講義および付属教材）です。買い切りであり、月額課金ではありません。ご購入後の視聴期限は原則として設けません。',
        'We sell digital educational content — video lessons and the materials that come with them. Purchases are one-time. This is not a subscription. As a rule there is no expiry on your access after purchase.'),
      s('3. アカウント', '3. Your account',
        'ご購入にはアカウントの作成が必要です。登録内容は正確にご記入ください。アカウントはご本人のみがご利用いただけます。パスワードの管理はお客様の責任で行ってください。',
        'You need an account to buy a course. Please keep your details accurate. Your account is for you alone. Keeping your password safe is your responsibility.'),
      s('4. お支払い', '4. Payment',
        '決済は Stripe を通じて行います。価格は市場ごとに設定しており、為替レートによる自動換算は行いません。表示価格に含まれる税の扱いは、お住まいの国により異なります［要専門家確認］。',
        'Payments are handled through Stripe. Prices are set per market and are not converted automatically from Japanese yen. How tax is treated in the displayed price depends on your country [NEEDS LEGAL REVIEW].'),
      s('5. できること・できないこと', '5. What you may and may not do',
        'ご購入いただいた講座は、お客様ご自身の学習と、お客様のサロンでの実務にお使いいただけます。次の行為は禁止します：動画の録画・複製・再配布、アカウントの共有・譲渡、当サービスの教材をそのまま自分の商品として販売すること。',
        'You may use the course you bought for your own learning and in your own salon’s day-to-day work. The following are not allowed: recording, copying or redistributing the videos; sharing or transferring your account; reselling our materials as your own product.'),
      s('6. 章の追加について', '6. Chapters added later',
        '講座は章ごとに順次公開する場合があります。購入時に公開されていた章に加えて、その後に追加された章も、追加料金なしでご視聴いただけます。公開予定は変更されることがあります。',
        'A course may be released chapter by chapter. Chapters added after you buy are included at no extra cost, in addition to the ones available when you purchased. Release plans may change.'),
      s('7. 利用の停止', '7. Suspension',
        '本規約に違反した場合、事前の通知なくアカウントの利用を停止することがあります。この場合、返金は行いません。',
        'If you breach these terms we may suspend your account without prior notice. No refund is given in that case.'),
      s('8. 免責', '8. Disclaimer',
        '当サービスは教育コンテンツを提供するものであり、受講による事業上の成果を保証するものではありません。また、講座の内容は日本のサロンにおける実務に基づくもので、お客様の国の法令・衛生基準への適合を保証するものではありません。施術・営業にあたっては、必ずお客様の国の規制をご確認ください。',
        'We provide educational content. We do not guarantee any business outcome from taking a course. The content is based on practice in Japanese salons and is not a guarantee of compliance with the laws or hygiene rules of your country. Always check your own country’s regulations before applying anything in practice.'),
      s('9. 規約の変更', '9. Changes to these terms',
        'この規約は変更することがあります。重要な変更を行う場合は、サイト上でお知らせします。',
        'We may change these terms. If a change is significant we will announce it on the site.'),
      s('10. 準拠法と管轄', '10. Governing law',
        '［要確定・要専門家確認］準拠法および管轄裁判所。海外の消費者に販売するため、日本法のみを指定できるかは専門家の確認が必要です。',
        '[TO BE CONFIRMED / NEEDS LEGAL REVIEW] Governing law and jurisdiction. Because we sell to consumers outside Japan, whether Japanese law alone can be specified needs professional review.'),
    ],
  },
  privacy: {
    id: 'privacy',
    updated: '2026-09-13',
    sections: [
      s('1. 取得する情報', '1. What we collect',
        'お名前、メールアドレス、お住まいの国、ご購入履歴、受講の進捗です。電話番号・住所はお伺いしません。クレジットカード番号は当サービスでは保持せず、Stripe が取り扱います。',
        'Your name, email address, country, purchase history and course progress. We do not ask for a phone number or a postal address. We never hold your card number — Stripe handles that.'),
      s('2. 利用目的', '2. Why we use it',
        '講座の提供、ご購入の確認、お問い合わせへの回答、講座の案内のために使用します。',
        'To deliver your course, confirm your purchase, answer your questions, and tell you about courses.'),
      s('3. 第三者への提供', '3. Who we share it with',
        '［要確定］決済（Stripe）、メール送信、動画配信、サーバーの各事業者に、上記の目的に必要な範囲で提供します。事業者名は確定しだい記載します。それ以外の第三者へ販売・提供することはありません。',
        '[TO BE CONFIRMED] With our payment provider (Stripe), our email provider, our video provider and our hosting provider, only as far as needed for the purposes above. We will name each provider once they are decided. We never sell your data.'),
      s('4. 国外への移転', '4. International transfer',
        '当サービスは日本から運営しており、お客様の情報は日本国内および委託先の所在国のサーバーで処理されます。［要専門家確認］GDPR その他の域外移転規制への対応。',
        'We operate from Japan. Your data is processed on servers in Japan and in the countries where our providers operate. [NEEDS LEGAL REVIEW] Compliance with GDPR and other cross-border transfer rules.'),
      s('5. 保有期間', '5. How long we keep it',
        'アカウントをご利用の間、保有します。退会をご希望の場合はお問い合わせください。法令上の保存義務がある記録は、その期間保存します。',
        'For as long as your account is active. Contact us if you want it deleted. Records we are legally required to keep are retained for that period.'),
      s('6. お客様の権利', '6. Your rights',
        'ご自身の情報の開示・訂正・削除をご希望の場合は、お問い合わせフォームからご連絡ください。',
        'You can ask us to show, correct or delete your information. Contact us through the contact form.'),
      s('7. Cookie', '7. Cookies',
        'ログイン状態の保持と、表示する市場（通貨）の記憶に Cookie を使用します。［要確定］アクセス解析の導入有無。',
        'We use cookies to keep you signed in and to remember which market (currency) you chose. [TO BE CONFIRMED] Whether we will add analytics.'),
      s('8. 連絡先', '8. Contact',
        '［要確定］個人情報に関するお問い合わせ先。',
        '[TO BE CONFIRMED] Contact point for privacy questions.'),
    ],
  },
  refund: {
    id: 'refund',
    updated: '2026-09-13',
    sections: [
      s('1. 原則', '1. The rule',
        'デジタルコンテンツという商品の性質上、ご購入後の返金は原則として承っておりません。ご購入と同時に全編の視聴が可能になるためです。ご購入前に、講座ページで内容・公開状況・対応言語を必ずご確認ください。',
        'Because this is digital content, we do not offer refunds as a rule. Access opens the moment you buy. Please check the course page — what is included, which chapters are out, and which languages are available — before you purchase.'),
      s('2. 例外として返金する場合', '2. When we do refund',
        '次の場合は返金します：(1) 二重に決済された場合、(2) 当サービス側の不具合により視聴できず、当サービスが解決できない場合。いずれもお問い合わせフォームからご連絡ください。',
        'We refund in these cases: (1) you were charged twice; (2) you cannot watch because of a fault on our side and we cannot fix it. Contact us through the contact form in either case.'),
      s('3. 章の追加を待つ場合', '3. Waiting for later chapters',
        '公開予定の章が未公開であることを理由とした返金は承っておりません。追加される章は追加料金なしでご視聴いただけます。購入時点で視聴できる章は、講座ページに明示しています。',
        'We do not refund because a planned chapter is not out yet. Chapters added later are included at no extra cost. The course page always states which chapters you can watch today.'),
      s('4. 海外の消費者保護規定について', '4. Consumer withdrawal rights',
        '［要専門家確認・最重要］EU・英国などでは、デジタルコンテンツについて一定期間の解約権（クーリングオフ）が消費者に認められています。購入時に「即時提供に同意し、解約権が消滅することを承知する」旨の明示的な同意を取得しない限り、「原則返金不可」が適用できない可能性があります。購入画面の同意文言とあわせて、専門家の確認が必要です。',
        '[NEEDS LEGAL REVIEW — HIGH PRIORITY] In the EU, the UK and some other regions, consumers have a statutory right to withdraw from a digital content purchase within a set period. Unless we obtain the buyer’s express consent to immediate performance and an acknowledgement that they lose that right, a blanket “no refunds” policy may not be enforceable. The wording of the consent at checkout needs professional review alongside this page.'),
      s('5. 返金の方法', '5. How refunds are made',
        '返金は、ご購入時と同じ決済手段へ返金します。反映までの日数はカード会社により異なります。',
        'Refunds go back to the payment method you used. How long it takes to appear depends on your card issuer.'),
    ],
  },
  tokusho: {
    id: 'tokusho',
    updated: '2026-09-13',
    sections: [
      s('サービス名', 'Service name',
        'SAKURA JAPAN BEAUTY（屋号・ブランド名）',
        'SAKURA JAPAN BEAUTY (trade name / brand)'),
      s('販売事業者', 'Seller',
        '安藤さくら（個人事業主）',
        'Sakura Ando (sole proprietor)'),
      s('運営責任者', 'Responsible person',
        '安藤さくら',
        'Sakura Ando'),
      s('所在地', 'Address',
        '〒530-0047 大阪府大阪市北区西天満1-2-25 スクエア北浜3階',
        '3F Square Kitahama, 1-2-25 Nishitenma, Kita-ku, Osaka 530-0047, Japan'),
      s('電話番号', 'Phone number',
        '090-2781-3789（海外からは +81-90-2781-3789）',
        '+81-90-2781-3789 (from within Japan: 090-2781-3789)'),
      s('メールアドレス', 'Email',
        'oooh.vi5.information@gmail.com',
        'oooh.vi5.information@gmail.com'),
      s('販売価格', 'Price',
        '［要確定］各講座ページに表示する価格。市場ごとの固定価格とし、税の取り扱いを明記します。',
        '[TO BE CONFIRMED] The price shown on each course page. Prices are fixed per market; the treatment of tax will be stated.'),
      s('商品代金以外の必要料金', 'Additional costs',
        'ありません。インターネット接続に必要な通信料はお客様のご負担です。',
        'None. You are responsible for your own internet connection costs.'),
      s('お支払い方法', 'Payment methods',
        'クレジットカード等（Stripe による決済）。［要確定］対応ブランド・Apple Pay / Google Pay の有無。',
        'Credit card and similar methods through Stripe. [TO BE CONFIRMED] Which brands, and whether Apple Pay / Google Pay are enabled.'),
      s('お支払い時期', 'When payment is taken',
        'ご購入手続きの完了時に決済されます。',
        'At the time you complete your purchase.'),
      s('商品の提供時期', 'When you get access',
        '決済の確認後、ただちにご視聴いただけます。公開前の章については、講座ページに公開状況を表示します。',
        'Immediately after your payment is confirmed. For chapters not yet released, the course page shows their status.'),
      s('返品・返金について', 'Returns and refunds',
        'デジタルコンテンツのため、原則として返金は承っておりません。詳細は返金ポリシーをご確認ください。',
        'As digital content, we do not offer refunds as a rule. Please see the Refund Policy for details.'),
      s('動作環境', 'System requirements',
        'インターネット接続と、最新のブラウザが動作する端末。スマートフォンでご視聴いただけます。',
        'An internet connection and a device with an up-to-date browser. You can watch on a phone.'),
    ],
  },
};
