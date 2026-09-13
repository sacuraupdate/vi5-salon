import { CheckCircle2, Loader } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/session';
import { getCommerce } from '@/lib/commerce';
import { catalogRepository } from '@/lib/data';
import { tcText } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

/**
 * 決済の完了画面。
 *
 * **この画面では受講権限を一切付与しない。**
 * URL は購入者が自由に開けるため、ここで権限を付けると
 * 支払っていない人にも渡してしまう。付与するのは Stripe の Webhook だけ
 * （`src/app/api/stripe/webhook/route.ts`）。
 *
 * ここがやるのは「Webhook がすでに記録した購入を読んで表示する」ことだけ。
 * まだ記録が無ければ「確認中」と伝え、再読み込みを促す。
 */
export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/mypage`);

  const c = await getTranslations({ locale, namespace: 'checkout' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const commerce = getCommerce();
  const purchase = sessionId && commerce ? await commerce.getPurchaseBySessionId(sessionId) : null;

  // 他人の購入を表示しない。自分の購入で、かつ支払い済みのものだけを「完了」とする
  const mine = purchase && purchase.userId === session.userId && purchase.status === 'paid' ? purchase : null;

  if (!mine) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="flex flex-col items-center gap-5 p-8 text-center">
          <Loader className="h-7 w-7 text-ink-muted" strokeWidth={1.25} />
          <h1 className="font-serif text-[20px] leading-relaxed text-ink">{c('pendingTitle')}</h1>
          <p className="text-sm leading-loose text-ink-muted">{c('pendingBody')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* サーバーで読み直すためのリンク。クライアントで状態を持たない */}
            <a href={`?session_id=${encodeURIComponent(sessionId ?? '')}`} className={buttonClass('primary')}>
              {c('reload')}
            </a>
            <Link href="/contact" className="text-[13px] text-vermilion hover:underline">
              {c('contactUs')}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const course = await catalogRepository.getCourse(mine.courseSlug);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="flex flex-col items-center gap-5 p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-pine" strokeWidth={1.25} />
        <h1 className="font-serif text-[22px] leading-relaxed text-ink">{c('successTitle')}</h1>
        {course ? (
          <p className="text-[15px] text-ink">{tcText(course.title, locale, common('preparing'))}</p>
        ) : null}
        <p className="text-sm leading-loose text-ink-muted">{c('successBody')}</p>
        <Link href={`/learn/${mine.courseSlug}`} className={buttonClass('primary', 'lg')}>
          {c('startLearning')}
        </Link>
      </Card>
    </div>
  );
}
