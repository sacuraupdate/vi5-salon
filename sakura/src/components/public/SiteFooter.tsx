import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Logo from '@/components/brand/Logo';
import { SakuraDivider } from '@/components/brand/Sakura';

export default function SiteFooter() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="mt-20 border-t border-line bg-washi">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-sm leading-relaxed text-ink-muted">{t('tagline')}</p>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">{t('learn')}</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/courses" className="hover:text-crimson">{nav('courses')}</Link></li>
              <li><Link href="/free" className="hover:text-crimson">{nav('free')}</Link></li>
              <li><Link href="/mypage" className="hover:text-crimson">{nav('mypage')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">{t('about')}</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/instructors/sakura" className="hover:text-crimson">SAKURA</Link></li>
              <li><Link href="/instructors/tomomi" className="hover:text-crimson">TOMOMI</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">{t('support')}</h3>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted">
              <li>{t('contact')}</li>
              <li>{t('terms')}</li>
              <li>{t('privacy')}</li>
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">{t('legalNote')}</p>
          </div>
        </div>
        <SakuraDivider className="my-8" />
        <p className="text-center text-xs text-ink-muted">© 2026 SAKURA JAPAN BEAUTY</p>
      </div>
    </footer>
  );
}
