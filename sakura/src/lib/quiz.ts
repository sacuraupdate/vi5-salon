import type { Course, CourseLevel } from './data/types';

/**
 * 3問のおすすめ講座診断。AI や外部APIは使わず、単純なルールで決める。
 * 単発講座を並べるのではなく、「最終ゴールまでの学習ルート」を返す。
 */
export const QUIZ_ROLES = ['owner', 'staff', 'opening', 'general', 'other'] as const;
export const QUIZ_TOPICS = ['salon', 'management', 'hospitality', 'technique', 'femcare'] as const;
export const QUIZ_LEVELS = ['beginner', 'experienced', 'pro'] as const;

export type QuizRole = (typeof QUIZ_ROLES)[number];
export type QuizTopic = (typeof QUIZ_TOPICS)[number];
export type QuizExperience = (typeof QUIZ_LEVELS)[number];
export type QuizAnswer = { role: QuizRole; topic: QuizTopic; experience: QuizExperience };

/**
 * 学習ルート。既存の講座を「王道の順路」として並べる。
 * flagship＝そのカテゴリーの旗艦講座。診断では必ずこれを軸にする。
 */
export const learningRoutes = [
  {
    id: 'salon',
    flagship: 'japanese-salon-standard',
    slugs: ['salon-space-design', 'japanese-salon-standard', 'salon-management-basics'],
  },
  {
    id: 'technique',
    flagship: 'eyelash-technique',
    slugs: ['salon-space-design', 'brow-design', 'eyelash-technique', 'makeup-for-photo'],
  },
  {
    id: 'femcare',
    flagship: 'femcare-basics',
    slugs: ['femcare-basics', 'life-stage-care', 'femcare-for-pros'],
  },
] as const;

export type LearningRouteId = (typeof learningRoutes)[number]['id'];

/** 学びたいことを学習ルートに対応づける */
const topicRoute: Record<QuizTopic, LearningRouteId> = {
  salon: 'salon',
  management: 'salon',
  hospitality: 'salon',
  technique: 'technique',
  femcare: 'femcare',
};

const levelOrder: Record<CourseLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/**
 * ルートの終点に何を置けるかを、実データから判定する。
 * 認定対象の講座が1つも無いルートで「認定へ」と表示して誤認させないため。
 */
export function routeGoalKind(courses: Course[], slugs: readonly string[]): 'certification' | 'completion' {
  const has = slugs.some((s) => courses.find((c) => c.slug === s)?.certificate === 'certification');
  return has ? 'certification' : 'completion';
}

/**
 * 回答から学習ルートを決める。
 * ・分野は「一番学びたいこと」で決まる
 * ・旗艦講座を必ず含める（細かな単発講座を先頭に出さない）
 * ・経験者は無料入門を飛ばし、旗艦講座から始める
 */
export function recommendRoute(answer: QuizAnswer): { routeId: LearningRouteId; slugs: string[]; flagship: string } {
  const routeId = topicRoute[answer.topic];
  const route = learningRoutes.find((r) => r.id === routeId)!;
  const slugs: string[] = [...route.slugs];
  const flagshipIndex = slugs.indexOf(route.flagship);

  // 初心者は入門から。経験者・プロは旗艦講座から始める
  const start = answer.experience === 'beginner' ? 0 : flagshipIndex;

  return { routeId, slugs: slugs.slice(start), flagship: route.flagship };
}

/** 講座詳細の「前後におすすめ」。同じルート内での前後を返す。 */
export function neighboursOf(slug: string): { prev?: string; next?: string } {
  for (const r of learningRoutes) {
    const slugs: string[] = [...r.slugs];
    const i = slugs.indexOf(slug);
    if (i >= 0) return { prev: slugs[i - 1], next: slugs[i + 1] };
  }
  return {};
}

export { levelOrder };
