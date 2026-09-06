import type {
  AdminTask,
  CountrySales,
  CourseSales,
  DailySales,
  Inquiry,
  SalesSummary,
  Student,
} from '../types';

export const salesSummaryOwner: SalesSummary = {
  todayJpy: 128400,
  monthJpy: 2841600,
  monthDiffPercent: 12.4,
  newStudents: 38,
  openTaskCount: 5,
};

export const salesSummaryInstructor: SalesSummary = {
  todayJpy: 21800,
  monthJpy: 486200,
  monthDiffPercent: 8.1,
  newStudents: 9,
  openTaskCount: 2,
};

/** 直近30日の日次売上（グラフ用） */
export const dailySales: DailySales[] = [
  62000, 74000, 51000, 88000, 96000, 71000, 64000, 103000, 118000, 92000,
  77000, 69000, 85000, 124000, 141000, 96000, 88000, 73000, 91000, 132000,
  115000, 87000, 79000, 94000, 128000, 156000, 112000, 98000, 106000, 128400,
].map((jpy, i, arr) => {
  // 基準日から遡って実在する日付を作る（月をまたいでも壊れないように Date で計算する）
  const base = new Date('2026-09-06T00:00:00Z');
  base.setUTCDate(base.getUTCDate() - (arr.length - 1 - i));
  return { date: base.toISOString().slice(0, 10), jpy };
});

export const courseSales: CourseSales[] = [
  { courseSlug: 'japanese-salon-standard', title: { ja: '日本式サロンスタンダード 基礎' }, instructorId: 'sakura', orders: 42, jpy: 831600 },
  { courseSlug: 'omotenashi-counselling', title: { ja: 'おもてなしカウンセリング' }, instructorId: 'sakura', orders: 24, jpy: 595200 },
  { courseSlug: 'eyelash-technique', title: { ja: '日本のまつげ技術 実践' }, instructorId: 'sakura', orders: 18, jpy: 536400 },
  { courseSlug: 'femcare-basics', title: { ja: 'フェムケア基礎' }, instructorId: 'tomomi', orders: 16, jpy: 300800 },
  { courseSlug: 'salon-management-basics', title: { ja: '日本式サロン経営の基礎' }, instructorId: 'sakura', orders: 7, jpy: 243600 },
  { courseSlug: 'life-stage-care', title: { ja: '女性のライフステージとケア' }, instructorId: 'tomomi', orders: 6, jpy: 130800 },
  { courseSlug: 'femcare-for-pros', title: { ja: '美容従事者のためのフェムケア実践' }, instructorId: 'tomomi', orders: 2, jpy: 55600 },
  { courseSlug: 'repeat-and-retail', title: { ja: 'リピートと店販の考え方' }, instructorId: 'sakura', orders: 8, jpy: 158400 },
];

export const countrySales: CountrySales[] = [
  { country: { ja: '台湾' }, orders: 31, jpy: 742000 },
  { country: { ja: 'シンガポール' }, orders: 24, jpy: 604000 },
  { country: { ja: '韓国' }, orders: 21, jpy: 498000 },
  { country: { ja: 'オーストラリア' }, orders: 14, jpy: 356000 },
  { country: { ja: 'アメリカ' }, orders: 12, jpy: 328000 },
  { country: { ja: 'その他' }, orders: 21, jpy: 313600 },
];

export const adminTasks: AdminTask[] = [
  { id: 't1', title: '英語のお問い合わせが2件届いています', kind: 'inquiry', dueLabel: '本日中', urgent: true, instructorId: 'sakura' },
  { id: 't2', title: '「おもてなしカウンセリング」の韓国語訳が原本より古くなっています', kind: 'course', dueLabel: '今週中', urgent: true, instructorId: 'sakura' },
  { id: 't3', title: '認定証の発行申請が1件あります', kind: 'certificate', dueLabel: '今週中', urgent: false, instructorId: 'sakura' },
  { id: 't4', title: '今月の投稿がまだ公開されていません', kind: 'post', dueLabel: '9月10日まで', urgent: false, instructorId: 'sakura' },
  { id: 't5', title: '「フェムケア基礎」に新しいレビューが3件つきました', kind: 'course', dueLabel: '期限なし', urgent: false, instructorId: 'tomomi' },
  { id: 't6', title: 'フェムケア実践の教材PDFが未アップロードです', kind: 'course', dueLabel: '今週中', urgent: true, instructorId: 'tomomi' },
];

export const inquiries: Inquiry[] = [
  { id: 'q1', name: 'Chloe Martin', country: { ja: 'オーストラリア' }, language: 'en', subject: '購入した講座の資料がダウンロードできない', receivedAt: '2026-09-06', status: 'open', instructorId: 'sakura' },
  { id: 'q2', name: '陳 佳蓉', country: { ja: '台湾' }, language: 'zh-TW', subject: '認定証の発行条件について知りたい', receivedAt: '2026-09-06', status: 'open', instructorId: 'sakura' },
  { id: 'q3', name: 'Minji Kim', country: { ja: '韓国' }, language: 'ko', subject: 'フェムケア基礎の韓国語字幕について', receivedAt: '2026-09-05', status: 'open', instructorId: 'tomomi' },
  { id: 'q4', name: 'Sarah Nguyen', country: { ja: 'シンガポール' }, language: 'en', subject: '領収書の発行をお願いしたい', receivedAt: '2026-09-04', status: 'answered', instructorId: 'sakura' },
  { id: 'q5', name: '山田 美咲', country: { ja: '日本' }, language: 'ja', subject: '講座の受講期限を確認したい', receivedAt: '2026-09-03', status: 'answered', instructorId: 'sakura' },
];

export const students: Student[] = [
  { id: 's1', name: 'Jasmine Lim', country: { ja: 'シンガポール' }, language: 'en', courseCount: 4, progressPercent: 72, joinedAt: '2026-03-14', instructorIds: ['sakura', 'tomomi'] },
  { id: 's2', name: '陳 佳蓉', country: { ja: '台湾' }, language: 'zh-TW', courseCount: 3, progressPercent: 45, joinedAt: '2026-04-02', instructorIds: ['sakura'] },
  { id: 's3', name: 'Minji Kim', country: { ja: '韓国' }, language: 'ko', courseCount: 2, progressPercent: 88, joinedAt: '2026-04-19', instructorIds: ['tomomi'] },
  { id: 's4', name: 'Chloe Martin', country: { ja: 'オーストラリア' }, language: 'en', courseCount: 1, progressPercent: 12, joinedAt: '2026-06-30', instructorIds: ['sakura'] },
  { id: 's5', name: 'Amelia Chen', country: { ja: 'アメリカ' }, language: 'en', courseCount: 2, progressPercent: 100, joinedAt: '2026-05-08', instructorIds: ['sakura'] },
  { id: 's6', name: '林 佩雯', country: { ja: '台湾' }, language: 'zh-TW', courseCount: 5, progressPercent: 64, joinedAt: '2026-02-21', instructorIds: ['sakura', 'tomomi'] },
  { id: 's7', name: 'Hana Suzuki', country: { ja: '日本' }, language: 'ja', courseCount: 3, progressPercent: 30, joinedAt: '2026-07-11', instructorIds: ['tomomi'] },
  { id: 's8', name: 'Priya Nair', country: { ja: 'マレーシア' }, language: 'en', courseCount: 1, progressPercent: 5, joinedAt: '2026-09-01', instructorIds: ['sakura'] },
];
