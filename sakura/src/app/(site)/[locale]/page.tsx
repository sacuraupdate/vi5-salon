import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  Scissors as ScissorsIcon,
  Store,
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
import { SakuraDivider, Seal } from '@/components/brand/Sakura';
import { BrandBranch, BrandCrest, BrandPetals } from '@/components/brand/BrandArt';
import CourseCard from '@/components/public/CourseCard';
import { Badge, IconFrame, SectionHeading } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import CourseQuiz from '@/components/public/CourseQuiz';
import LearningRoutes from '@/components/public/LearningRoutes';
import { brandAsset, BRAND_FILES } from '@/lib/brand-assets';
import { learningRoutes, routeGoalKind } from '@/lib/quiz';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const h = await getTranslations({ locale, namespace: 'home' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const q = await getTranslations({ locale, namespace: 'quiz' });

  const [featured, categories, courses, instructors] = await Promise.all([
    catalogRepository.listFeaturedCourses(3),
    catalogRepository.listCategories(),
    catalogRepository.listCourses(),
    catalogRepository.listInstructors(),
  ]);

  const sakura = instructors.find((i) => i.id === 'sakura')!;
  const tomomi = instructors.find((i) => i.id === 'tomomi')!;

  // HERO は sakura-portrait-hero.png のみ。他の3枚は TOP のこの位置では使わない。
  // 写真が無いときは人物プレースホルダを出さず、ブランドの文字と桜だけで右側を成立させる
  const heroPhoto = brandAsset(BRAND_FILES.portraitHero);
  // SAKURA紹介セクションは sakura-portrait-about.png。HERO と同じ写真は使わない
  const aboutPhoto = brandAsset(BRAND_FILES.portraitAbout) ?? sakura.photoUrl ?? null;

  const audience = [
    { icon: Store, label: h('aud1') },
    { icon: ScissorsIcon, label: h('aud2') },
    { icon: Briefcase, label: h('aud3') },
    { icon: GraduationCap, label: h('aud4') },
  ];

  const bySlug = new Map(courses.map((c) => [c.slug, c]));

  const routeLabels: Record<string, { label: string; desc: string }> = {
    salon: { label: h('routeSalon'), desc: h('routeSalonDesc') },
    technique: { label: h('routeTechnique'), desc: h('routeTechniqueDesc') },
    femcare: { label: h('routeFemcare'), desc: h('routeFemcareDesc') },
  };
  const routes = learningRoutes.map((r) => {
    // 終点は実データから判定する。認定対象が無いルートで「認定へ」と出さない
    const goalKind = routeGoalKind(courses, r.slugs);
    return {
      id: r.id,
      label: routeLabels[r.id].label,
      desc: routeLabels[r.id].desc,
      goalKind,
      goalLabel: goalKind === 'certification' ? h('routeGoal') : h('routeGoalCompletion'),
      flagshipLabel: q('flagship'),
      steps: r.slugs
        .map((slug) => bySlug.get(slug))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .map((c) => ({
          slug: c.slug,
          title: t(c.title, locale),
          levelLabel: common(`level.${c.level}`),
          isFree: c.isFree,
          freeLabel: common('free'),
          isFlagship: c.slug === r.flagship,
        })),
    };
  });

  // 迷ったら、まずこれ＝日本式サロンの旗艦講座
  const firstPick = bySlug.get('japanese-salon-standard');

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
      {/* ① HERO ─ 背景は完全な白。和紙は使わない */}
      <section className="relative overflow-hidden border-b border-line bg-bg">
        {/* 桜の枝は右半分を切り抜いた枠の中だけに描く。見出しには決して重ならない */}
        <BrandBranch />

        {/* 花びらは3枚だけ。右上から中央へ流れる軌跡をつくる（PCのみ）。
            正式な桜素材が入るまでは描かない＝桜色の面を増やさない（assetOnly） */}
        <BrandPetals className="top-[7%] right-[9%] hidden h-14 w-14 lg:block" opacity={0.5} assetOnly />
        <BrandPetals className="top-[34%] right-[27%] hidden h-10 w-10 lg:block" opacity={0.36} rotate={26} assetOnly />
        <BrandPetals className="top-[62%] right-[41%] hidden h-8 w-8 lg:block" opacity={0.24} rotate={-14} assetOnly />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 pt-8 pb-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pt-14 lg:pb-12">
          <div className="flex flex-col items-start gap-5">
            <span className="flex items-center gap-3">
              <BrandCrest className="h-5 w-5 text-vermilion" />
              <span className="eyebrow">{h('eyebrow')}</span>
            </span>

            {/* 大見出しは墨と濃紺。朱赤は下の短い罫だけに使う */}
            <h1 className="text-[27px] leading-[1.45] tracking-[0.06em] sm:text-[34px] lg:text-[38px]">
              {h('title')}
              <br />
              <span className="text-navy">{h('titleAccent')}</span>
            </h1>

            <span className="h-[2px] w-14 bg-vermilion" aria-hidden />

            <p className="max-w-xl text-[13px] leading-[1.9] text-ink-2 sm:text-sm">{h('lead')}</p>

            {/* 主要CTA＝診断。無料講座は最重要ボタンにしない */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <CourseQuiz routes={routes} label={h('ctaPrimary')} variant="primary" />
              <Link href="/courses" className={buttonClass('secondary', 'lg')}>
                {h('ctaSecondary')}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>

            {/* こんな方におすすめ。カードにせず、濃紺の罫とアイコンで1行として強く見せる */}
            <div className="w-full border-t-2 border-navy/25 pt-4">
              <span className="text-[10px] tracking-[0.3em] text-navy">{h('audienceTitle')}</span>
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-4 sm:gap-x-4">
                {audience.map((a, i) => (
                  <li
                    key={a.label}
                    className={`flex items-center gap-2.5 ${i === 0 ? '' : 'sm:border-l sm:border-line sm:pl-4'}`}
                  >
                    <a.icon className="h-5 w-5 shrink-0 text-navy" strokeWidth={1.5} />
                    <span className="text-[13px] leading-[1.35] font-medium text-ink">{a.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SAKURA。写真があれば人物レイアウト、無ければブランドビジュアルだけで見せる */}
          <div className="relative">
            {heroPhoto ? (
              <>
                <PhotoFrame
                  src={heroPhoto}
                  alt="SAKURA"
                  kind="portrait"
                  priority
                  /* 顔・髪飾り・上半身が入るよう、中央よりやや上でトリミングする */
                  focus="50% 22%"
                  className="h-[380px] w-full border border-navy/25 sm:h-[440px] lg:h-[470px]"
                />
                {/* 写真の上には文字を重ねない。名前・肩書はすべて写真の下の罫に置く */}
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-3">
                  <span className="font-serif text-[15px] tracking-[0.24em] text-ink">SAKURA</span>
                  <span className="text-[11px] tracking-[0.1em] text-ink-muted">{h('instructorLead')}</span>
                  <span className="text-[11px] tracking-[0.1em] text-ink-muted">{t(sakura.role, locale)}</span>
                </div>
              </>
            ) : (
              /* 写真が入るまでの状態。仮シルエットは出さず、桜紋・SAKURA・肩書だけで組む。
                 背面の桜の枝と花びらがそのまま抜けて見える。 */
              <div className="flex flex-col items-start gap-4 border-t border-line pt-8 lg:min-h-[380px] lg:items-center lg:justify-center lg:border-t-0 lg:border-l lg:border-line lg:pt-0 lg:pl-12">
                <BrandCrest className="h-7 w-7 text-gold" />
                <span className="-mr-[0.28em] font-serif text-[38px] leading-none tracking-[0.28em] text-ink sm:text-[46px]">
                  SAKURA
                </span>
                <span className="h-px w-14 bg-vermilion" aria-hidden />
                <span className="text-[12px] tracking-[0.14em] text-ink-2">{h('instructorLead')}</span>
                <span className="text-[11px] tracking-[0.1em] text-ink-muted">{t(sakura.role, locale)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ①-2 どこから学びますか？ ─ 先に3つの入口、その後に「迷ったら、まずこれ」 */}
      <section className="border-b border-line bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <SectionHeading eyebrow="Learning Routes" title={h('routesTitle')} lead={h('routesLead')} />

          {/* まず3つの入口。ここで自分の学ぶ順番を決めてもらう */}
          <div className="mt-8">
            <LearningRoutes routes={routes} />
          </div>

          {/* それでも決められない人の逃げ道。旗艦講座を1件だけ、コンパクトに示す */}
          {firstPick ? (
            <Link
              href={`/courses/${firstPick.slug}`}
              className="band-navy group mt-10 flex flex-col gap-4 border-l-2 border-vermilion px-5 py-5 transition-colors hover:bg-navy-deep sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6"
            >
              <div className="flex flex-col items-start gap-2.5">
                {/* 朱赤の小さなアクセント。重要な導線であることを一目で示す */}
                <span className="bg-vermilion px-2 py-0.5 text-[10px] tracking-[0.16em] text-white">
                  {h('firstPickTitle')}
                </span>
                <span className="text-[9px] tracking-[0.28em] text-on-navy-muted uppercase">
                  Japanese Salon Standard
                </span>
                <span className="font-serif text-[19px] tracking-[0.08em] text-white">
                  {t(firstPick.title, locale)}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                <span className="text-[12px] leading-relaxed text-on-navy-muted">{h('firstPickDesc')}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white" strokeWidth={1.5} />
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      {/* ② 学べること */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <SectionHeading eyebrow="Curriculum" title={h('categoriesTitle')} lead={h('categoriesLead')} />
        <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
          {groups.map((g) => (
            <Link key={g.group} href="/courses" className="group bg-bg p-5 transition-colors hover:bg-navy/5 sm:p-6">
              <IconFrame>
                <g.icon className="h-4.5 w-4.5" strokeWidth={1.25} />
              </IconFrame>
              <h3 className="mt-4 font-serif text-[15px] tracking-[0.08em] text-ink">{g.title}</h3>
              <p className="mt-2 text-xs leading-loose text-ink-muted">{g.desc}</p>
              <span className="mt-4 inline-block text-[10px] tracking-[0.14em] text-vermilion">
                {h('catCount', { count: countOf(g.group) })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ③ 注目講座 */}
      <section className="border-y border-line bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <SectionHeading
            eyebrow="Featured"
            title={h('featuredTitle')}
            lead={h('featuredLead')}
            action={
              <Link href="/courses" className="inline-flex items-center gap-2 text-[13px] text-vermilion hover:underline">
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

      {/* ④ なぜ日本の美容なのか ─ 濃紺の面。ページ全体にメリハリをつける */}
      <section className="band-navy">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="eyebrow text-on-navy-muted">Why Japan</span>
            <h2 className="text-[22px] sm:text-[28px]">{h('whyTitle')}</h2>
            <span className="my-2 h-px w-12 bg-vermilion" aria-hidden />
            <p className="max-w-2xl text-[13px] leading-loose text-on-navy-muted">{h('whyLead')}</p>
          </div>
          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/15">
            {why.map((w, i) => (
              <div key={w.title} className={`flex flex-col gap-3 ${i === 0 ? 'sm:pr-10' : 'sm:px-10'}`}>
                <span className="font-serif text-[11px] tracking-[0.3em] text-gold">{`0${i + 1}`}</span>
                <h3 className="font-serif text-[18px] tracking-[0.1em]">{w.title}</h3>
                <p className="text-[13px] leading-loose text-on-navy-muted">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑤ SAKURA 紹介 */}
      <section className="bg-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <PhotoFrame
            src={aboutPhoto}
            alt="SAKURA"
            kind="portrait"
            focus="50% 24%"
            className="h-80 w-full border border-navy/25 lg:h-[440px]"
          />
          <div className="flex flex-col items-start gap-5">
            <span className="eyebrow">{h('sakuraTitle')}</span>
            <h2 className="font-serif text-[28px] tracking-[0.24em] text-ink">SAKURA</h2>
            <span className="h-px w-12 bg-vermilion" aria-hidden />
            <p className="text-[12px] tracking-[0.1em] text-ink-muted">{t(sakura.role, locale)}</p>
            <blockquote className="band-navy border-l-2 border-vermilion px-6 py-5">
              <p className="font-serif text-[17px] leading-[2] tracking-[0.06em] sm:text-[19px]">
                {t(sakura.headline, locale)}
              </p>
            </blockquote>
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
              className="inline-flex items-center gap-2 text-[13px] text-vermilion hover:underline"
            >
              {h('tomomiMore')}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ⑦ 学ぶ → 修了 → 証明 */}
      <section className="relative overflow-hidden border-t border-line bg-bg">
        <BrandPetals className="top-[8%] left-[3%] h-20 w-20 sm:h-28 sm:w-28" opacity={0.28} />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <SectionHeading eyebrow="Learn to Certify" title={h('flowTitle')} lead={h('flowLead')} align="center" />

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {flow.map((f) => (
                <li key={f.n} className="flex items-start gap-5 py-5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-line font-serif text-[13px] text-vermilion">
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
            <figure className="washi-texture relative flex flex-col border border-line p-6">
              <span className="absolute inset-x-4 top-4 h-px bg-gold opacity-60" aria-hidden />
              <figcaption className="eyebrow mt-2">{h('certSample')}</figcaption>
              <SakuraDivider className="my-5" mark={<BrandCrest className="h-5 w-5 text-gold" />} />
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
