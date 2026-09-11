import { cookies } from 'next/headers';
import { ADMIN_ROLE_COOKIE, isAdminDemoMode } from './admin-permissions';
import type { AdminRole } from './data/types';

/**
 * Phase 1 の暫定。Cookie から表示ロールを読むだけで、認証は行わない。
 * Phase 2 で実セッション（サーバー側の権限チェック）に置き換える。
 *
 * デモモードが無効のとき（＝本番）は Cookie を一切信用せず、
 * 最小権限の 'instructor' を返す。Cookie を書き換えても OWNER にはならない。
 */
export async function getAdminRole(): Promise<AdminRole> {
  if (!isAdminDemoMode()) return 'instructor';
  const store = await cookies();
  return store.get(ADMIN_ROLE_COOKIE)?.value === 'instructor' ? 'instructor' : 'owner';
}
