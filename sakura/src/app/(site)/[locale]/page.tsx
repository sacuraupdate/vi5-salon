import {
  ArrowRight,
  Award,
  Building2,
  HeartPulse,
  Medal,
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
import { PetalField, Petal, SakuraDivider } from '@/components/brand/Sakura';
import CourseCard from '@/components/public/CourseCard';
import { Badge, Card, SectionHeading } from '@/components/ui/Card';
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
    { n: '01', icon: Sparkles, title: h('flow1Title'), desc: h('flow1Desc') },
    { n: '02', icon: ShieldCheck, title: h('flow2Title'), desc: h('flow2Desc') },
    { n: '03', icon: Medal, title: h('flow3Title'), desc: h('flow3Desc') },
  ];

  return (
    <>
      {/* ① HERO ─ 5秒で「日本発の美容教育」と SAKURA が主役だと伝える */}
      <section className="relative overflow-hidden border-b border-line bg-linear-to-b from-sakura-soft to-bg">
        <PetalField />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-12">
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-2 rounded-sm border border-sakura bg-bg px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] text-crimson">
              <Petal rotate={20} className="h-3.5 w-3.5" />
              {h('eyebrow')}
            </span>

            <h1 className="text-[30px] leading-[1.25] tracking-[0.01em] sm:text-[38px] lg:text-[40px]">
              {h('title')}
              <br />
              <span className="text-crimson">{h('titleAccent')}</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-ink-muted sm:text-[15px]">{h('lead')}</p>

            <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
              <Link href="/courses" className={buttonClass('primary', 'lg')}>
                {h('ctaPrimary')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/free" className={buttonClass('secondary', 'lg')}>
                {h('ctaSecondary')}
              </Link>
            </div>

            <dl className="grid w-full max-w-md grid-cols-3 gap-4 border-t border-line pt-4">
              {[
                { v: `${courses.length}`, l: h('trustCourses') },
                { v: '18', l: h('trustCountries') },
                { v: '2', l: h('trustCertificate') },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-serif text-2xl text-ink">{s.v}</dt>
                  <dd className="mt-0.5 text-[11px] leading-tight text-ink-muted">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* SAKURA本人を大きく見せる領域。正式写真は photoUrl を入れるだけで差し替わる。 */}
          <div className="relative">
            <PhotoFrame
              src={sakura.photoUrl}
              alt="SAKURA"
              kind="portrait"
              priority
              className="h-60 w-full rounded-md border border-line shadow-card sm:h-80 lg:h-[440px]"
            />
            <Card className="absolute -bottom-4 left-4 max-w-[78%] p-3 sm:left-6 sm:p-4">
              <p className="font-serif text-sm tracking-[0.1em] text-ink">SAKURA</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{t(sakura.role, locale)}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* ② 学べるカテゴリー ─ 講師ではなく内容から探せる導線 */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
        <SectionHeading eyebrow="Categories" title={h('categoriesTitle')} lead={h('categoriesLead')} />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {groups.map((g) => (
            <Link key={g.group} href="/courses">
              <Card hover className="flex h-full flex-col gap-2.5 p-4 sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-sakura-soft text-crimson">
                  <g.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="text-[15px] font-medium">{g.title}</h3>
                <p className="text-xs leading-relaxed text-ink-muted">{g.desc}</p>
                <span className="mt-auto pt-2 text-[11px] text-crimson">
                  {h('catCount', { count: countOf(g.group) })}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ③ 注目講座 ─ 3件のみ。モバイルは横スワイプ */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
          <SectionHeading
            eyebrow="Featured"
            title={h('featuredTitle')}
            lead={h('featuredLead')}
            action={
              <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-crimson hover:underline">
                {common('viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {featured.map((course) => (
              <div key={course.slug} className="min-w-[82%] snap-start sm:min-w-[52%] lg:min-w-0">
                <CourseCard course={course} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ なぜ日本の美容なのか ─ 3ポイントのみ。長文にしない */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
        <SectionHeading eyebrow="Why Japan" title={h('whyTitle')} lead={h('whyLead')} align="center" />
        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
          {why.map((w, i) => (
            <Card key={w.title} className="flex items-start gap-3 p-4 sm:flex-col sm:gap-3 sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-sakura-soft text-crimson">
                <w.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1 sm:gap-2">
                <h3 className="flex items-baseline gap-2 text-[15px] font-medium">
                  <span className="font-serif text-lg text-sakura">{`0${i + 1}`}</span>
                  {w.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-ink-muted sm:text-sm">{w.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ⑤ SAKURA紹介 */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <PhotoFrame
            src={sakura.photoUrl}
            alt="SAKURA"
            kind="portrait"
            className="aspect-4/5 w-full max-w-sm rounded-md border border-line shadow-card"
          />
          <div className="flex flex-col items-start gap-4">
            <span className="text-[11px] font-medium tracking-[0.16em] text-crimson uppercase">
              {h('sakuraTitle')}
            </span>
            <h2 className="font-serif text-2xl tracking-[0.12em]">SAKURA</h2>
            <p className="text-sm text-ink-muted">{t(sakura.role, locale)}</p>
            <p className="font-serif text-lg leading-relaxed text-ink">{t(sakura.headline, locale)}</p>
            <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted sm:line-clamp-4">{t(sakura.bio, locale)}</p>
            <dl className="grid grid-cols-3 gap-4 border-t border-line pt-4">
              {sakura.stats.map((s) => (
                <div key={s.value}>
                  <dt className="font-serif text-xl">{s.value}</dt>
                  <dd className="text-[11px] text-ink-muted">{t(s.label, locale)}</dd>
                </div>
              ))}
            </dl>
            <Link href="/instructors/sakura" className={buttonClass('secondary', 'md')}>
              {h('sakuraMore')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ⑥ TOMOMI ─ 1ブロックのみ。ブランドの中心にはしない */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
        <Card className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:items-center sm:p-6">
          <PhotoFrame
            src={tomomi.photoUrl}
            alt="TOMOMI"
            kind="portrait"
            tone={2}
            className="aspect-square w-full rounded-sm border border-line sm:aspect-4/5"
          />
          <div className="flex flex-col items-start gap-2.5">
            <Badge tone="sakura">{h('tomomiTag')}</Badge>
            <h2 className="font-serif text-xl tracking-[0.12em]">TOMOMI</h2>
            <p className="text-xs text-ink-muted">{t(tomomi.role, locale)}</p>
            <p className="text-sm leading-relaxed text-ink">{t(tomomi.headline, locale)}</p>
            <Link
              href="/instructors/tomomi"
              className="inline-flex items-center gap-1 text-sm text-crimson hover:underline"
            >
              {h('tomomiMore')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>

      {/* ⑦ 学ぶ → 修了 → 証明 */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
          <SectionHeading eyebrow="Learn to Certify" title={h('flowTitle')} lead={h('flowLead')} align="center" />

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-[1fr_1fr_1fr_0.9fr]">
            {flow.map((f) => (
              <Card key={f.n} className="flex flex-col gap-2.5 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-sakura-soft text-crimson">
                    <f.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                  </span>
                  <span className="font-serif text-xl text-sakura">{f.n}</span>
                </div>
                <h3 className="text-[15px] font-medium">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-muted sm:text-sm">{f.desc}</p>
              </Card>
            ))}

            {/* 証明書サンプル：修了証・認定証が実在することを視覚的に示す */}
            <div className="relative col-span-2 overflow-hidden rounded-md border border-sakura bg-bg p-4 shadow-card sm:p-5 lg:col-span-1">
              <PetalField className="opacity-70" />
              <div className="relative flex h-full flex-col">
                <span className="text-[10px] tracking-[0.16em] text-ink-muted uppercase">{h('certSample')}</span>
                <SakuraDivider className="my-3" />
                <p className="font-serif text-[15px] text-ink">Jasmine Lim</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {t({ ja: '日本式サロンスタンダード 基礎', en: 'Japanese Salon Standards' }, locale)}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <Badge tone="sakura">
                    <Award className="h-3 w-3" />
                    {common('certificate.completion')}
                  </Badge>
                  <span className="font-mono text-[10px] text-ink-muted">SJB-2026-0841</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link href="/courses" className={buttonClass('primary', 'lg')}>
              {h('finalCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-ink-muted">{h('finalNote')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
