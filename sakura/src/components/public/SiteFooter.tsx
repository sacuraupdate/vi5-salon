import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SakuraMark } from '@/components/brand/Sakura';

export default function SiteFooter() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    // 濃紺の面。ページの締めとして白との対比をつくる
    <footer className="band-navy mt-0">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2.5">
              <SakuraMark className="h-5 w-5 shrink-0 text-sakura" />
              <span className="flex flex-col leading-none">
                <span className="font-serif text-[15px] tracking-[0.2em]">SAKURA</span>
                <span className="mt-1 text-[8px] tracking-[0.3em] text-on-navy-muted">JAPAN BEAUTY</span>
              </span>
            </span>
            <p className="text-[13px] leading-loose text-on-navy-muted">{t('tagline')}</p>
          </div>
          <div>
            <h3 className="mb-4 text-[10px] tracking-[0.3em] text-on-navy-muted uppercase">{t('learn')}</h3>
            <ul className="flex flex-col gap-2.5 text-[13px]">
              <li><Link href="/courses" className="hover:text-sakura">{nav('courses')}</Link></li>
              <li><Link href="/free" className="hover:text-sakura">{nav('free')}</Link></li>
              <li><Link href="/mypage" className="hover:text-sakura">{nav('mypage')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-[10px] tracking-[0.3em] text-on-navy-muted uppercase">{t('about')}</h3>
            <ul className="flex flex-col gap-2.5 text-[13px]">
              <li><Link href="/instructors/sakura" className="hover:text-sakura">SAKURA</Link></li>
              <li><Link href="/instructors/tomomi" className="hover:text-sakura">TOMOMI</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-[10px] tracking-[0.3em] text-on-navy-muted uppercase">{t('support')}</h3>
            <ul className="flex flex-col gap-2.5 text-[13px] text-on-navy-muted">
              <li>{t('contact')}</li>
              <li>{t('terms')}</li>
              <li>{t('privacy')}</li>
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-on-navy-muted">{t('legalNote')}</p>
          </div>
        </div>
        <div className="mt-12 flex items-center gap-4 border-t border-white/15 pt-6">
          <span className="h-px flex-1 bg-transparent" />
          <p className="text-[11px] tracking-[0.14em] text-on-navy-muted">© 2026 SAKURA JAPAN BEAUTY</p>
          <span className="h-px flex-1 bg-transparent" />
        </div>
      </div>
    </footer>
  );
}
