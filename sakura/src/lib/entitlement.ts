import type { Entitlement, SiteSession } from './data/types';
import { learnerRepository } from './data';
import { getCommerce } from './commerce';
import { isSiteDemoMode } from './session';

/**
 * 受講権限の判定。**画面側は必ずこの関数を通す。**
 *
 * 重要な前提：
 * - 受講権限は Stripe の Webhook で支払いを確認したあとにだけ作る
 *   （`src/app/api/stripe/webhook/route.ts`）。
 *   決済成功ページの表示では作らない。URL を直接開かれると偽造できるため。
 * - 視聴期限は原則なし（expiresAt: null）。
 *
 * データベースが接続されていればそちらが正。
 * 未接続のときは、確認用（SITE_DEMO_MODE）に限りモックの受講データを使う。
 * **本番でデータベースが未接続なら、誰も何も視聴できない。**
 */
export async function listEntitlements(session: SiteSession | null): Promise<Entitlement[]> {
  if (!session) return [];

  const commerce = getCommerce();
  if (commerce) return commerce.listEntitlements(session.userId);

  if (!isSiteDemoMode()) return [];
  const enrollments = await learnerRepository.listEnrollments();
  return enrollments.map((e) => ({
    userId: session.userId,
    courseSlug: e.courseSlug,
    grantedAt: e.lastStudiedAt,
    expiresAt: null,
  }));
}

/** その講座を視聴してよいか。期限切れも不可とする */
export async function hasEntitlement(session: SiteSession | null, courseSlug: string): Promise<boolean> {
  if (!session) return false;
  const today = new Date().toISOString().slice(0, 10);
  return (await listEntitlements(session)).some(
    (e) => e.courseSlug === courseSlug && (e.expiresAt === null || e.expiresAt >= today),
  );
}
