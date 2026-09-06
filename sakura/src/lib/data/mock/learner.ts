import type { Certificate, Enrollment, LearnerProfile } from '../types';

export const learnerProfile: LearnerProfile = {
  name: 'Jasmine Lim',
  email: 'jasmine@example.com',
  country: { ja: 'シンガポール', en: 'Singapore', ko: '싱가포르', 'zh-TW': '新加坡' },
  memberSince: '2026-03-14',
};

export const enrollments: Enrollment[] = [
  {
    courseSlug: 'japanese-salon-standard',
    progressPercent: 62,
    lastLessonId: 'c2-l2',
    lastLessonTitle: { ja: '道具の消毒と保管', en: 'Sterilising and storing tools' },
    lastStudiedAt: '2026-09-05',
    completedAt: null,
  },
  {
    courseSlug: 'omotenashi-counselling',
    progressPercent: 28,
    lastLessonId: 'c1-l2',
    lastLessonTitle: { ja: '質問の順番を設計する', en: 'Designing the question order' },
    lastStudiedAt: '2026-09-02',
    completedAt: null,
  },
  {
    courseSlug: 'eyelash-technique',
    progressPercent: 100,
    lastLessonId: 'c3-l2',
    lastLessonTitle: { ja: 'ホームケアの伝え方', en: 'Explaining home care' },
    lastStudiedAt: '2026-08-11',
    completedAt: '2026-08-11',
  },
  {
    courseSlug: 'femcare-basics',
    progressPercent: 100,
    lastLessonId: 'c2-l2',
    lastLessonTitle: { ja: '言葉の選び方', en: 'Choosing your words' },
    lastStudiedAt: '2026-07-20',
    completedAt: '2026-07-20',
  },
];

export const certificates: Certificate[] = [
  { id: 'SJB-2026-0841', kind: 'completion', courseSlug: 'eyelash-technique', holderName: 'Jasmine Lim', instructorId: 'sakura', issuedAt: '2026-08-11' },
  { id: 'SJB-2026-0765', kind: 'completion', courseSlug: 'femcare-basics', holderName: 'Jasmine Lim', instructorId: 'tomomi', issuedAt: '2026-07-20' },
  { id: 'SJB-2026-0402', kind: 'certification', courseSlug: 'omotenashi-counselling', holderName: 'Jasmine Lim', instructorId: 'sakura', issuedAt: '2026-05-30' },
];
