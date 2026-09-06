'use client';

import { Award, FileText, Home, PlayCircle, UserCog } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

/** マイページの主要メニュー。モバイルは下部固定、デスクトップは横並び。 */
export default function MyPageNav() {
  const m = useTranslations('mypage');
  const pathname = usePathname();

  const items = [
    { href: '/mypage', label: m('navHome'), icon: Home },
    { href: '/mypage/courses', label: m('navCourses'), icon: PlayCircle },
    { href: '/mypage/materials', label: m('navMaterials'), icon: FileText },
    { href: '/mypage/certificates', label: m('navCertificates'), icon: Award },
    { href: '/mypage/account', label: m('navAccount'), icon: UserCog },
  ];

  const active = (href: string) => (href === '/mypage' ? pathname === href : pathname.startsWith(href));

  return (
    <>
      {/* デスクトップ／タブレット */}
      <nav className="hidden border-b border-line sm:block">
        <ul className="mx-auto flex max-w-5xl gap-1 px-4">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className={`flex min-h-12 items-center gap-2 border-b-2 px-3 text-sm transition-colors ${
                  active(i.href)
                    ? 'border-crimson font-medium text-crimson'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <i.icon className="h-4 w-4" strokeWidth={1.5} />
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* モバイル：下部固定ナビ */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pt-1 backdrop-blur sm:hidden">
        <ul className="flex">
          {items.map((i) => (
            <li key={i.href} className="flex-1">
              <Link
                href={i.href}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 ${
                  active(i.href) ? 'text-crimson' : 'text-ink-muted'
                }`}
              >
                <i.icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[10px] leading-none">{i.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
