import {
  ArrowRight,
  Building2,
  HeartPulse,
  Scissors,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { catalogRepository } from '@/lib/data';
import { t } from '@/lib/format';
import PhotoFrame from '@/components/brand/PhotoFrame';
import { PetalShadow, SakuraCrest, SakuraDivider, Seal } from '@/components/brand/Sakura';
import CourseCard from '@/components/public/CourseCard';
import { Badge, IconFrame, SectionHeading } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const h = await getTranslations({ locale, namespace: 'home' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const [featured, categories, courses, instructors] = await Promise.all([
    catalogRepository.listFeaturedCourses(3),
    catalogRepository.listCategories(),
    catalogRepository.listCourses(),
    catalogRepository.listInstructors(),
  ]);

  const sakura = instructors.find((i) => i.id === 'sakura')!;
  const tomomi = instructors.find((i) => i.id === 'tomomi')!;

  const countOf = (group: string) =>
    courses.filter((c) => categories.find((cat) => cat.id === c.categoryId)?.group === group).length;

  const groups = [
    { group: 'japanese-salon', icon: Building2, title: h('catSalon'), desc: h('catSalonDesc') },
    { group: 'management', icon: TrendingUp, title: h('catManagement'), desc: h('catManagementDesc') },
    { group: 'technique', icon: Scissors, title: h('catTechnique'), desc: h('catTechniqueDesc') },
    { group: 'femcare', icon: HeartPulse, title: h('catFemcare'), desc: h('catFemcareDesc') },
  ];

  const why = [
    { icon: Sparkles, title: h('why1Title'), desc: h('why1Desc') },
    { icon: ShieldCheck, title: h('why2Title'), desc: h('why2Desc') },
    { icon: HeartPulse, title: h('why3Title'), desc: h('why3Desc') },
  ];

  const flow = [
    { n: '壱', title: h('flow1Title'), desc: h('flow1Desc') },
    { n: '弐', title: h('flow2Title'), desc: h('flow2Desc') },
    { n: '参', title: h('flow3Title'), desc: h('flow3Desc') },
  ];

  return (
    <>
      {/* ① HERO ─ SAKURA を主役に。地は和紙、桜は影として1箇所だけ */}
      <section className="washi-texture relative overflow-hidden border-b border-line">
        <PetalShadow />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_0.9fr] lg:gap-14 lg:py-16">
          <div className="flex flex-col items-start gap-6">
            <span className="flex items-center gap-3">
              <SakuraCrest className="h-4 w-4 text-crimson" />
              <span className="eyebrow">{h('eyebrow')}</span>
            </span>

            <h1 className="text-[30px] leading-[1.45] tracking-[0.08em] sm:text-[40px] lg:text-[44px]">
              {h('title')}
              <br />
              <span className="text-crimson">{h('titleAccent')}</span>
            </h1>

            <span className="h-px w-16 bg-crimson" aria-hidden />

            <p className="max-w-xl text-[13px] leading-loose text-ink-2 sm:text-sm">{h('lead')}</p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/courses" className={buttonClass('primary', 'lg')}>
                {h('ctaPrimary')}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <Link href="/free" className={buttonClass('secondary', 'lg')}>
                {h('ctaSecondary')}
              </Link>
            </div>

            <dl className="grid w-full max-w-lg grid-cols-3 divide-x divide-line border-t border-line pt-5">
              {[
                { v: `${courses.length}`, l: h('trustCourses') },
                { v: '18', l: h('trustCountries') },
                { v: '2', l: h('trustCertificate') },
              ].map((s, i) => (
                <div key={s.l} className={i === 0 ? 'pr-4' : 'px-4'}>
                  <dt className="font-serif text-[26px] leading-none text-ink">{s.v}</dt>
                  <dd className="mt-2 text-[10px] leading-tight tracking-[0.1em] text-ink-muted">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* SAKURA本人。正式写真は photoUrl を入れるだけで差し替わる */}
          <div className="relative">
            <PhotoFrame
              src={sakura.photoUrl}
              alt="SAKURA"
              kind="portrait"
              priority
              className="h-72 w-full border border-line sm:h-96 lg:h-[500px]"
            />
            {/* 縦書きの講師名。写真の左端に沿わせて存在感を出す */}
            <span
              className="absolute top-8 -left-4 hidden bg-bg px-2 py-5 font-serif text-[22px] whitespace-nowrap tracking-[0.32em] text-ink lg:block"
              style={{ writingMode: 'vertical-rl' }}
            >
              SAKURA
            </span>
            {/* 肩書きは横書きの細い行で。縦書きに詰め込まない */}
            <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <span className="font-serif text-[13px] tracking-[0.24em] text-ink lg:hidden">SAKURA</span>
              <span className="text-[11px] tracking-[0.14em] text-ink-muted">{t(sakura.role, locale)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ② 学べること */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <SectionHeading eyebrow="Curriculum" title={h('categoriesTitle')} lead={h('categoriesLead')} />
        <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
          {groups.map((g) => (
            <Link key={g.group} href="/courses" className="group bg-bg p-5 transition-colors hover:bg-washi sm:p-6">
              <IconFrame>
                <g.icon className="h-4.5 w-4.5" strokeWidth={1.25} />
              </IconFrame>
              <h3 className="mt-4 font-serif text-[15px] tracking-[0.08em] text-ink">{g.title}</h3>
              <p className="mt-2 text-xs leading-loose text-ink-muted">{g.desc}</p>
              <span className="mt-4 inline-block text-[10px] tracking-[0.14em] text-crimson">
                {h('catCount', { count: countOf(g.group) })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ③ 注目講座 */}
      <section className="washi-texture border-y border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <SectionHeading
            eyebrow="Featured"
            title={h('featuredTitle')}
            lead={h('featuredLead')}
            action={
              <Link href="/courses" className="inline-flex items-center gap-2 text-[13px] text-crimson hover:underline">
                {common('viewAll')}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            }
          />
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {featured.map((course) => (
              <div key={course.slug} className="min-w-[82%] snap-start sm:min-w-[52%] lg:min-w-0">
                <CourseCard
                  course={course}
                  locale={locale}
                  category={categories.find((cat) => cat.id === course.categoryId)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ なぜ日本の美容なのか ─ 縦罫で区切る静かな三分割 */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <SectionHeading eyebrow="Why Japan" title={h('whyTitle')} lead={h('whyLead')} align="center" />
        <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
          {why.map((w, i) => (
            <div key={w.title} className={`flex flex-col gap-3 ${i === 0 ? 'sm:pr-8' : 'sm:px-8'}`}>
              <span className="font-serif text-[11px] tracking-[0.3em] text-gold">{`0${i + 1}`}</span>
              <h3 className="font-serif text-[17px] tracking-[0.1em] text-ink">{w.title}</h3>
              <p className="text-[13px] leading-loose text-ink-muted">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ⑤ SAKURA 紹介 */}
      <section className="border-y border-line bg-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <PhotoFrame
            src={sakura.photoUrl}
            alt="SAKURA"
            kind="portrait"
            className="h-80 w-full border border-line lg:h-[440px]"
          />
          <div className="flex flex-col items-start gap-5">
            <span className="eyebrow">{h('sakuraTitle')}</span>
            <h2 className="font-serif text-[28px] tracking-[0.24em] text-ink">SAKURA</h2>
            <span className="h-px w-12 bg-crimson" aria-hidden />
            <p className="text-[12px] tracking-[0.1em] text-ink-muted">{t(sakura.role, locale)}</p>
            <p className="font-serif text-[19px] leading-[2] tracking-[0.06em] text-ink">
              {t(sakura.headline, locale)}
            </p>
            <p className="line-clamp-4 text-[13px] leading-loose text-ink-muted">{t(sakura.bio, locale)}</p>
            <dl className="grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
              {sakura.stats.map((s, i) => (
                <div key={s.value} className={i === 0 ? 'pr-6' : 'px-6'}>
                  <dt className="font-serif text-[20px] text-ink">{s.value}</dt>
                  <dd className="mt-1 text-[10px] tracking-[0.1em] text-ink-muted">{t(s.label, locale)}</dd>
                </div>
              ))}
            </dl>
            <Link href="/instructors/sakura" className={buttonClass('secondary')}>
              {h('sakuraMore')}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ⑥ TOMOMI */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="grid items-center gap-6 border border-line p-5 sm:grid-cols-[160px_1fr] sm:p-7">
          <PhotoFrame
            src={tomomi.photoUrl}
            alt="TOMOMI"
            kind="portrait"
            tone={2}
            minimal
            className="h-40 w-full border border-line sm:h-52"
          />
          <div className="flex flex-col items-start gap-3">
            <Badge tone="sakura">{h('tomomiTag')}</Badge>
            <h2 className="font-serif text-[21px] tracking-[0.22em] text-ink">TOMOMI</h2>
            <p className="text-[11px] tracking-[0.1em] text-ink-muted">{t(tomomi.role, locale)}</p>
            <p className="text-[13px] leading-loose text-ink-2">{t(tomomi.headline, locale)}</p>
            <Link
              href="/instructors/tomomi"
              className="inline-flex items-center gap-2 text-[13px] text-crimson hover:underline"
            >
              {h('tomomiMore')}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ⑦ 学ぶ → 修了 → 証明 */}
      <section className="washi-texture border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <SectionHeading eyebrow="Learn to Certify" title={h('flowTitle')} lead={h('flowLead')} align="center" />

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {flow.map((f) => (
                <li key={f.n} className="flex items-start gap-5 py-5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-line font-serif text-[13px] text-crimson">
                    {f.n}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-serif text-[16px] tracking-[0.1em] text-ink">{f.title}</h3>
                    <p className="text-[13px] leading-loose text-ink-muted">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* 証明書サンプル：印章と金の細罫で格式を出す */}
            <figure className="relative flex flex-col border border-line bg-bg p-6">
              <span className="absolute inset-x-4 top-4 h-px bg-gold opacity-60" aria-hidden />
              <figcaption className="eyebrow mt-2">{h('certSample')}</figcaption>
              <SakuraDivider className="my-5" />
              <p className="font-serif text-[19px] tracking-[0.14em] text-ink">Jasmine Lim</p>
              <p className="mt-2 text-[12px] leading-loose text-ink-muted">
                {t({ ja: '日本式サロンスタンダード 基礎', en: 'Japanese Salon Standards' }, locale)}
              </p>
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] tracking-[0.16em] text-ink-muted">{h('certId')}</span>
                  <span className="font-mono text-[11px] text-ink-2">SJB-2026-0841</span>
                </div>
                <Seal label="修了" />
              </div>
              <span className="absolute inset-x-4 bottom-4 h-px bg-gold opacity-60" aria-hidden />
            </figure>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <Link href="/courses" className={buttonClass('primary', 'lg')}>
              {h('finalCta')}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <p className="text-[11px] tracking-[0.06em] text-ink-muted">{h('finalNote')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
