import { cookies } from 'next/headers';
import { ROLE_COOKIE } from './admin-nav';
import type { AdminRole } from './data/types';

/**
 * Phase 1 の暫定。Cookie から表示ロールを読むだけで、認証は行わない。
 * Phase 2 で実セッション（サーバー側の権限チェック）に置き換える。
 */
export async function getAdminRole(): Promise<AdminRole> {
  const store = await cookies();
  return store.get(ROLE_COOKIE)?.value === 'instructor' ? 'instructor' : 'owner';
}
