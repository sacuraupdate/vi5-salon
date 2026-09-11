'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_ROLE_COOKIE, isAdminDemoMode } from '@/lib/admin-permissions';

/**
 * Phase 1 の確認用。表示する権限を切り替えるだけで、認証は行わない。
 * Cookie の書き込みはサーバー側で行う。
 */
export async function setAdminRole(formData: FormData) {
  // デモモードが無効のときは、この操作自体を受け付けない
  if (!isAdminDemoMode()) return;
  const value = formData.get('role') === 'instructor' ? 'instructor' : 'owner';
  const store = await cookies();
  store.set(ADMIN_ROLE_COOKIE, value, { path: '/', maxAge: 60 * 60 * 24 });
  revalidatePath('/admin', 'layout');
}
