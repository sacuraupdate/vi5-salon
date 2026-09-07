import type { Course, CourseLevel } from './data/types';

/**
 * 3問のおすすめ講座診断。AI や外部APIは使わず、単純なルールで決める。
 * 回答から「まずはこちら」「次におすすめ」の2件を返す。
 */
export const QUIZ_ROLES = ['owner', 'staff', 'opening', 'general', 'other'] as const;
export const QUIZ_TOPICS = ['salon', 'management', 'hospitality', 'technique', 'femcare'] as const;
export const QUIZ_LEVELS = ['beginner', 'experienced', 'pro'] as const;

export type QuizRole = (typeof QUIZ_ROLES)[number];
export type QuizTopic = (typeof QUIZ_TOPICS)[number];
export type QuizExperience = (typeof QUIZ_LEVELS)[number];

export type QuizAnswer = { role: QuizRole; topic: QuizTopic; experience: QuizExperience };

/** 学びたいことを講座カテゴリーに対応づける */
const topicCategories: Record<QuizTopic, string[]> = {
  salon: ['salon-standard', 'omotenashi'],
  management: ['salon-management', 'inbound'],
  hospitality: ['omotenashi', 'salon-standard'],
  technique: ['beauty-skill', 'makeup'],
  femcare: ['femcare-basic', 'life-stage', 'femcare-pro'],
};

/** 経験に対応する到達レベル */
const experienceLevel: Record<QuizExperience, CourseLevel> = {
  beginner: 'beginner',
  experienced: 'intermediate',
  pro: 'advanced',
};

const levelOrder: Record<CourseLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/**
 * 回答から2件を選ぶ。
 * 1件目＝学びたい分野の中で、経験に対して無理のない最も易しい講座。
 * 2件目＝その次の段階（無ければ同分野の別講座、それも無ければ経営やサロン基礎から補う）。
 */
export function recommendCourses(courses: Course[], answer: QuizAnswer): { first?: Course; next?: Course } {
  const wanted = topicCategories[answer.topic];
  const target = levelOrder[experienceLevel[answer.experience]];

  const inTopic = courses
    .filter((c) => wanted.includes(c.categoryId))
    .sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  // 開業予定・オーナーは経営系を後押しする
  const boost = answer.role === 'owner' || answer.role === 'opening';

  const first =
    inTopic.find((c) => levelOrder[c.level] <= target && c.isFree) ??
    inTopic.find((c) => levelOrder[c.level] <= target) ??
    inTopic[0];

  const rest = inTopic.filter((c) => c.slug !== first?.slug);
  const next =
    rest.find((c) => first && levelOrder[c.level] > levelOrder[first.level]) ??
    (boost ? courses.find((c) => c.categoryId === 'salon-management' && c.slug !== first?.slug) : undefined) ??
    rest[0] ??
    courses.find((c) => c.slug !== first?.slug);

  return { first, next };
}

/** 学習ルート（TOPのタブ）。既存の講座を順路として並べる。 */
export const learningRoutes = [
  { id: 'salon', slugs: ['salon-space-design', 'japanese-salon-standard', 'salon-management-basics'] },
  { id: 'technique', slugs: ['salon-space-design', 'brow-design', 'eyelash-technique', 'makeup-for-photo'] },
  { id: 'femcare', slugs: ['femcare-basics', 'life-stage-care', 'femcare-for-pros'] },
] as const;

export type LearningRouteId = (typeof learningRoutes)[number]['id'];
