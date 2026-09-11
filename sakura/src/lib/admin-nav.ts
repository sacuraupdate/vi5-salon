import {
  Activity,
  BarChart3,
  Clapperboard,
  Home,
  Inbox,
  Medal,
  Megaphone,
  PlayCircle,
  Settings,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_ROLE_COOKIE, canAccessRoute } from './admin-permissions';
import type { AdminRole } from './data/types';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 講師向けにはラベルを変える（「自分の売上」など） */
  instructorLabel?: string;
};

/**
 * 管理画面のメニュー。ラベルとアイコンだけを持つ。
 * **誰に見せるかはここでは決めない。** 権限は admin-permissions.ts の定義に従う。
 */
export const adminNav: AdminNavItem[] = [
  { href: '/admin', label: 'ダッシュボード', icon: Home },
  { href: '/admin/sales', label: '売上・分析', icon: BarChart3, instructorLabel: '自分の売上' },
  { href: '/admin/courses', label: '講座', icon: PlayCircle },
  { href: '/admin/studio', label: '講座制作', icon: Clapperboard },
  { href: '/admin/students', label: '受講者', icon: Users, instructorLabel: 'お客様' },
  { href: '/admin/certificates', label: '修了証・認定証', icon: Medal },
  { href: '/admin/posts', label: '投稿・発信', icon: Megaphone },
  { href: '/admin/products', label: '商品・クーポン', icon: Ticket, instructorLabel: 'クーポン' },
  { href: '/admin/inquiries', label: 'お問い合わせ', icon: Inbox },
  { href: '/admin/ai', label: 'AI作業センター', icon: Sparkles },
  { href: '/admin/system', label: 'システム状況', icon: Activity },
  { href: '/admin/settings', label: '設定', icon: Settings },
];

/** 権限定義に従ってメニューを組み立てる。メニュー側で権限を判断しない */
export function navFor(role: AdminRole): AdminNavItem[] {
  return adminNav
    .filter((i) => canAccessRoute(role, i.href))
    .map((i) => (role === 'instructor' && i.instructorLabel ? { ...i, label: i.instructorLabel } : i));
}

export const ROLE_COOKIE = ADMIN_ROLE_COOKIE;

export const roleLabel: Record<AdminRole, string> = {
  owner: 'SAKURA（オーナー）',
  instructor: 'TOMOMI（講師）',
};
