import type { AdminRole } from './data/types';

/**
 * 管理画面の権限定義。**ここが唯一の正（Source of Truth）**。
 * サイドメニュー・URLアクセス制御・ページガード・自動検査は、すべてここを参照する。
 * メニューに載せない管理URLを足しても守られるよう、定義に無いパスは拒否する（既定拒否）。
 *
 * proxy（ミドルウェア相当）からも読むため、このファイルはアイコンやReactを import しない。
 */

export const ADMIN_ROLE_COOKIE = 'sjb_admin_role';

/** proxy が判定をスキップする、拒否表示そのもののパス（無限ループ防止） */
export const ADMIN_DENIED_PATH = '/admin/denied';

/**
 * Phase 1 の管理画面（認証なし・ロール切替つき）を動かしてよいか。
 *
 * 認証が未実装の間、本番で /admin を開けてはいけない。
 * ADMIN_DEMO_MODE を明示しない限り、本番（NODE_ENV=production）では常に無効にする。
 * Cloudflare へ誤ってデプロイしても、管理画面は動かない。
 */
export function isAdminDemoMode(): boolean {
  const flag = process.env.ADMIN_DEMO_MODE;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  // 明示されていない場合：開発中のみ有効、本番は無効
  return process.env.NODE_ENV !== 'production';
}

export type AdminRouteRule = {
  route: string;
  allowedRoles: readonly AdminRole[];
  /** 何のページか。拒否画面と自動検査の表示に使う */
  label: string;
};

const OWNER: readonly AdminRole[] = ['owner'];
const BOTH: readonly AdminRole[] = ['owner', 'instructor'];

export const adminRoutes: readonly AdminRouteRule[] = [
  { route: '/admin', allowedRoles: BOTH, label: 'ダッシュボード' },
  { route: '/admin/denied', allowedRoles: BOTH, label: '権限のお知らせ' },
  { route: '/admin/sales', allowedRoles: BOTH, label: '売上・分析' },
  { route: '/admin/courses', allowedRoles: BOTH, label: '講座' },
  { route: '/admin/students', allowedRoles: BOTH, label: '受講者' },
  { route: '/admin/posts', allowedRoles: BOTH, label: '投稿・発信' },
  { route: '/admin/products', allowedRoles: BOTH, label: '商品・クーポン' },
  { route: '/admin/inquiries', allowedRoles: BOTH, label: 'お問い合わせ' },
  { route: '/admin/studio', allowedRoles: OWNER, label: '講座制作' },
  { route: '/admin/certificates', allowedRoles: OWNER, label: '修了証・認定証の管理' },
  { route: '/admin/ai', allowedRoles: OWNER, label: 'AI作業センター' },
  { route: '/admin/system', allowedRoles: OWNER, label: 'システム状況' },
  { route: '/admin/settings', allowedRoles: OWNER, label: '設定' },
];

/**
 * 最長一致で規則を引く。/admin/posts/new は /admin/posts の規則を継ぐ。
 *
 * ただし ROOT（/admin）だけは前方一致にしない。
 * 前方一致にすると /admin/どんなURL でもダッシュボードの権限を継いでしまい、
 * 「定義に無いURLは拒否」が成立しなくなる。
 */
const ADMIN_ROOT = '/admin';

export function ruleFor(pathname: string): AdminRouteRule | null {
  const path = pathname.replace(/\/+$/, '') || ADMIN_ROOT;
  let best: AdminRouteRule | null = null;
  for (const rule of adminRoutes) {
    const exact = path === rule.route;
    const prefix = rule.route !== ADMIN_ROOT && path.startsWith(`${rule.route}/`);
    if (exact || prefix) {
      if (!best || rule.route.length > best.route.length) best = rule;
    }
  }
  return best;
}

/**
 * そのロールでこのURLを開いてよいか。
 * 定義に無い管理URLはオーナー専用として扱う。
 * 「メニューに無いから守られない」状態を作らないための既定拒否。
 */
export function canAccessRoute(role: AdminRole, pathname: string): boolean {
  const rule = ruleFor(pathname);
  if (!rule) return role === 'owner';
  return rule.allowedRoles.includes(role);
}

/** そのロールで開けないパスの一覧。自動検査が使う */
export function routesDeniedTo(role: AdminRole): AdminRouteRule[] {
  return adminRoutes.filter((r) => !r.allowedRoles.includes(role));
}
