import type { Entitlement, SiteSession } from './data/types';
import { learnerRepository } from './data';

/**
 * 受講権限の判定。**画面側は必ずこの関数を通す。**
 *
 * 重要な前提：
 * - 受講権限は Stripe の Webhook で支払いを確認したあとにだけ作る。
 *   決済成功ページの表示では作らない（URL を直接開かれると偽造できるため）。
 * - 視聴期限は原則なし（expiresAt: null）。
 *
 * Phase 2 では entitlements テーブルの参照に差し替える。
 * それまでは確認用に、モックの受講データを権限とみなす。
 */
export async function listEntitlements(session: SiteSession | null): Promise<Entitlement[]> {
  if (!session) return [];
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
