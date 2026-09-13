import { redirect } from 'next/navigation';
import MyPageNav from '@/components/public/MyPageNav';
import { getSession } from '@/lib/session';

/**
 * 購入者向け領域のガード。
 * 未ログインでは中身を一切描画しない（URL を直接開かれても同じ）。
 * proxy.ts でも1段目の判定を行っているが、こちらが本体。
 */
export const dynamic = 'force-dynamic';

export default async function MyPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/mypage`);

  return (
    <div className="pb-20 sm:pb-0">
      <MyPageNav />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</div>
    </div>
  );
}
