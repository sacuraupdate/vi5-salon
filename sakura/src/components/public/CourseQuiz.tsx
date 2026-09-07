'use client';

import { ArrowLeft, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonClass } from '@/components/ui/Button';
import {
  QUIZ_LEVELS,
  QUIZ_ROLES,
  QUIZ_TOPICS,
  recommendCourses,
  type QuizAnswer,
  type QuizExperience,
  type QuizRole,
  type QuizTopic,
} from '@/lib/quiz';
import type { Course } from '@/lib/data';

/** 表示に必要な最小限だけを受け取る（サーバー側で整形済み） */
export type QuizCourse = Pick<Course, 'slug' | 'level' | 'totalMinutes' | 'lessonCount' | 'categoryId' | 'isFree'> & {
  title: string;
  gain: string;
  certificateLabel: string | null;
  levelLabel: string;
  priceLabel: string;
  materialCount: number;
};

/**
 * 3問のおすすめ講座診断。ルールベースで、外部APIは使わない。
 * ページ遷移させず、モーダル内のステップUIで完結させる。
 */
export default function CourseQuiz({
  courses,
  label,
  variant = 'secondary',
}: {
  courses: (QuizCourse & { raw: Course })[];
  /** 開くボタンの文言。未指定なら診断用の既定文言 */
  label?: string;
  variant?: 'primary' | 'secondary';
}) {
  const q = useTranslations('quiz');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<Partial<QuizAnswer>>({});

  const reset = () => {
    setStep(0);
    setAnswer({});
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  const questions = [
    {
      label: q('q1'),
      options: QUIZ_ROLES.map((v) => ({
        value: v,
        label: q(`role${v[0].toUpperCase()}${v.slice(1)}` as 'roleOwner'),
      })),
      pick: (v: string) => setAnswer((a) => ({ ...a, role: v as QuizRole })),
    },
    {
      label: q('q2'),
      options: QUIZ_TOPICS.map((v) => ({
        value: v,
        label: q(`topic${v[0].toUpperCase()}${v.slice(1)}` as 'topicSalon'),
      })),
      pick: (v: string) => setAnswer((a) => ({ ...a, topic: v as QuizTopic })),
    },
    {
      label: q('q3'),
      options: QUIZ_LEVELS.map((v) => ({
        value: v,
        label: q(`exp${v[0].toUpperCase()}${v.slice(1)}` as 'expBeginner'),
      })),
      pick: (v: string) => setAnswer((a) => ({ ...a, experience: v as QuizExperience })),
    },
  ];

  const done = step >= questions.length;
  const result =
    done && answer.role && answer.topic && answer.experience
      ? recommendCourses(
          courses.map((c) => c.raw),
          answer as QuizAnswer,
        )
      : null;
  const view = (slug?: string) => courses.find((c) => c.slug === slug);

  const card = (label: string, c?: QuizCourse) =>
    c ? (
      <div className="border border-line p-4">
        <span className="eyebrow text-vermilion">{label}</span>
        <h4 className="mt-2 font-serif text-[15px] leading-relaxed text-ink">{c.title}</h4>
        <p className="mt-2 border-l-2 border-vermilion pl-3 text-[12px] leading-relaxed text-ink-2">{c.gain}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tracking-[0.08em] text-ink-muted">
          <span>{c.levelLabel}</span>
          <span aria-hidden className="text-line">|</span>
          <span>{c.totalMinutes}分</span>
          {c.certificateLabel ? (
            <>
              <span aria-hidden className="text-line">|</span>
              <span>{c.certificateLabel}</span>
            </>
          ) : null}
        </div>
        <Link
          href={`/courses/${c.slug}`}
          onClick={close}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-vermilion hover:underline"
        >
          {c.priceLabel}
        </Link>
      </div>
    ) : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass(variant, 'lg')}>
        <Sparkles className="h-4 w-4" strokeWidth={1.5} />
        {label ?? q('open')}
      </button>

      {open ? (
        <div role="dialog" aria-modal="true" aria-label={q('title')} className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-navy/50" onClick={close} aria-hidden />
          <div className="safe-bottom relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-y-auto border border-line bg-bg p-6 sm:max-h-[85dvh] sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="eyebrow">{q('title')}</span>
                <p className="text-[13px] leading-relaxed text-ink-muted">{q('lead')}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={q('close')}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line text-ink-2 hover:border-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!done ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.2em] text-ink-muted">
                    {q('step', { current: step + 1, total: questions.length })}
                  </span>
                  <span className="h-px flex-1 bg-line">
                    <span
                      className="block h-px bg-vermilion"
                      style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                    />
                  </span>
                </div>
                <h3 className="mb-4 font-serif text-[17px] tracking-[0.06em] text-ink">{questions[step].label}</h3>
                <div className="flex flex-col gap-2">
                  {questions[step].options.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        questions[step].pick(o.value);
                        setStep((s) => s + 1);
                      }}
                      className="flex min-h-12 items-center border border-line px-4 text-left text-[14px] text-ink transition-colors hover:border-navy hover:bg-navy hover:text-white"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-[13px] text-ink-muted hover:text-ink"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {q('back')}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <h3 className="mb-4 font-serif text-[17px] tracking-[0.06em] text-ink">{q('resultTitle')}</h3>
                <div className="flex flex-col gap-3">
                  {card(q('first'), view(result?.first?.slug))}
                  {card(q('next'), view(result?.next?.slug))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={reset} className={buttonClass('secondary')}>
                    {q('restart')}
                  </button>
                  <Link href="/courses" onClick={close} className={buttonClass('primary')}>
                    {q('seeAll')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
