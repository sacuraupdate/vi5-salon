import {
  ArrowRight,
  BadgeCheck,
  Compass,
  CreditCard,
  FileText,
  Medal,
  MonitorPlay,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonClass } from '@/components/ui/Button';
import { SakuraCrest } from '@/components/brand/Sakura';

export default async function GettingStartedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const g = await getTranslations({ locale, namespace: 'gettingStarted' });

  const steps = [
    { icon: Sparkles, title: g('s1'), desc: g('s1d') },
    { icon: Compass, title: g('s2'), desc: g('s2d') },
    { icon: CreditCard, title: g('s3'), desc: g('s3d') },
    { icon: MonitorPlay, title: g('s4'), desc: g('s4d') },
    { icon: FileText, title: g('s5'), desc: g('s5d') },
    { icon: BadgeCheck, title: g('s6'), desc: g('s6d') },
    { icon: Medal, title: g('s7'), desc: g('s7d') },
    { icon: TrendingUp, title: g('s8'), desc: g('s8d') },
  ];

  return (
    <>
      <section className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-10 sm:py-14">
          <span className="flex items-center gap-3">
            <SakuraCrest className="h-4 w-4 text-vermilion" />
            <span className="eyebrow">Start Here</span>
          </span>
          <h1 className="text-[26px] sm:text-[32px]">{g('title')}</h1>
          <span className="h-px w-14 bg-vermilion" aria-hidden />
          <p className="max-w-2xl text-[13px] leading-loose text-ink-2">{g('lead')}</p>
        </div>
      </section>

      {/* 番号・アイコン・矢印で流れを見せる。長文だけで説明しない */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <ol className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 bg-bg p-5 sm:p-6">
              <div className="flex flex-col items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line font-serif text-[13px] text-vermilion">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {i < steps.length - 1 ? (
                  <ArrowRight className="h-3.5 w-3.5 rotate-90 text-line" aria-hidden strokeWidth={1.5} />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2.5">
                  <s.icon className="h-4 w-4 shrink-0 text-pine" strokeWidth={1.25} />
                  <h2 className="font-serif text-[15px] tracking-[0.06em] text-ink">{s.title}</h2>
                </span>
                <p className="text-[12px] leading-loose text-ink-muted">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <Link href="/courses" className={buttonClass('primary', 'lg')}>
            {g('cta')}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </>
  );
}
