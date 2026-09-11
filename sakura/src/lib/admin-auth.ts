import { adminNav } from './admin-nav';
import { getAdminRole } from './admin-session';
import type { AdminRole, InstructorId } from './data/types';

/**
 * 管理画面の権限判定。UI の出し分けと同じ根拠を使い、判定をここ1か所に集約する。
 * メニューを隠すだけでは URL 直打ちを防げないため、ページ側でも必ずこれを呼ぶ。
 *
 * Phase 2 で本物のセッションに変えるときも、差し替えるのは
 * getAdminRole()（誰か）と、ここで使う所有者の判定だけで済むようにしてある。
 */

/** ロールと講師IDの対応。オーナーは特定の講師に紐づかない */
export function instructorIdOf(role: AdminRole): InstructorId | null {
  return role === 'instructor' ? 'tomomi' : null;
}

/**
 * オーナー専用のパス。メニュー定義（instructor: false）から導出するので、
 * メニューとガードが食い違うことがない。
 */
export const ownerOnlyPaths: string[] = adminNav.filter((i) => !i.instructor).map((i) => i.href);

export function isOwnerOnlyPath(pathname: string): boolean {
  return ownerOnlyPaths.includes(pathname);
}

/**
 * オーナー専用ページのガード。
 * 返り値が allowed: false のときは画面を描画せず、拒否の表示に切り替える。
 */
export async function ownerOnly(): Promise<{ allowed: boolean; role: AdminRole }> {
  const role = await getAdminRole();
  return { allowed: role === 'owner', role };
}

/**
 * 自分の持ち物かどうか。講師は自分が作った・自分に割り当てられたものだけ扱える。
 * 一覧はリポジトリ側で絞っているが、個別の取得・更新でも必ずこれを通す。
 * Phase 2 では API / Server Action の入口で呼ぶこと。
 */
export function canAccessRecord(role: AdminRole, ownerId: InstructorId | null): boolean {
  if (role === 'owner') return true;
  // 講師が触れるのは自分のものだけ。持ち主のいない「全体」のデータは触れない
  return ownerId !== null && ownerId === instructorIdOf(role);
}
