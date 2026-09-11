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
import type { AdminRole } from './data/types';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** TOMOMI（講師）にも見せる項目か */
  instructor: boolean;
  /** 講師向けにはラベルを変える（「自分の売上」など） */
  instructorLabel?: string;
};

/**
 * 管理画面のメニュー。ラベルはすべて日本語。
 * 権限による出し分けはこの1か所に集約し、画面を二重に持たない。
 */
export const adminNav: AdminNavItem[] = [
  { href: '/admin', label: 'ダッシュボード', icon: Home, instructor: true },
  { href: '/admin/sales', label: '売上・分析', icon: BarChart3, instructor: true, instructorLabel: '自分の売上' },
  { href: '/admin/courses', label: '講座', icon: PlayCircle, instructor: true },
  { href: '/admin/studio', label: '講座制作', icon: Clapperboard, instructor: false },
  { href: '/admin/students', label: '受講者', icon: Users, instructor: true, instructorLabel: 'お客様' },
  { href: '/admin/certificates', label: '修了証・認定証', icon: Medal, instructor: false },
  { href: '/admin/posts', label: '投稿・発信', icon: Megaphone, instructor: true },
  { href: '/admin/products', label: '商品・クーポン', icon: Ticket, instructor: true, instructorLabel: 'クーポン' },
  { href: '/admin/inquiries', label: 'お問い合わせ', icon: Inbox, instructor: true },
  { href: '/admin/ai', label: 'AI作業センター', icon: Sparkles, instructor: false },
  { href: '/admin/system', label: 'システム状況', icon: Activity, instructor: false },
  { href: '/admin/settings', label: '設定', icon: Settings, instructor: false },
];

export function navFor(role: AdminRole): AdminNavItem[] {
  if (role === 'owner') return adminNav;
  return adminNav
    .filter((i) => i.instructor)
    .map((i) => (i.instructorLabel ? { ...i, label: i.instructorLabel } : i));
}

export const ROLE_COOKIE = 'sjb_admin_role';

export const roleLabel: Record<AdminRole, string> = {
  owner: 'SAKURA（オーナー）',
  instructor: 'TOMOMI（講師）',
};
