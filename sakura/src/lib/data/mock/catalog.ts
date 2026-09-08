import type {
  Category,
  Chapter,
  Course,
  FreeContent,
  Instructor,
  Material,
  Review,
} from '../types';

export const categories: Category[] = [
  { id: 'salon-standard', name: { ja: '日本式サロンスタンダード', en: 'Japanese Salon Standards', ko: '일본식 살롱 스탠다드', 'zh-TW': '日式沙龍標準' }, instructorId: 'sakura', group: 'japanese-salon' },
  { id: 'omotenashi', name: { ja: '日本のおもてなし', en: 'Japanese Omotenashi', ko: '일본의 오모테나시', 'zh-TW': '日本款待之道' }, instructorId: 'sakura', group: 'japanese-salon' },
  { id: 'salon-management', name: { ja: '日本式サロン経営', en: 'Japanese Salon Management', ko: '일본식 살롱 경영', 'zh-TW': '日式沙龍經營' }, instructorId: 'sakura', group: 'management' },
  { id: 'inbound', name: { ja: '日本美容・インバウンド知識', en: 'Japanese Beauty & Inbound', ko: '일본 뷰티·인바운드', 'zh-TW': '日本美容與入境客知識' }, instructorId: 'sakura', group: 'management' },
  { id: 'beauty-skill', name: { ja: '日本の美容技術', en: 'Japanese Beauty Techniques', ko: '일본의 미용 기술', 'zh-TW': '日本美容技術' }, instructorId: 'sakura', group: 'technique' },
  { id: 'makeup', name: { ja: '美容・メイク', en: 'Beauty & Makeup', ko: '뷰티·메이크업', 'zh-TW': '美容彩妝' }, instructorId: 'sakura', group: 'technique' },
  { id: 'femcare-basic', name: { ja: 'フェムケア基礎', en: 'Femcare Basics', ko: '펨케어 기초', 'zh-TW': '女性照護基礎' }, instructorId: 'tomomi', group: 'femcare' },
  { id: 'life-stage', name: { ja: '女性のライフステージ', en: "Women's Life Stages", ko: '여성의 라이프 스테이지', 'zh-TW': '女性生命階段' }, instructorId: 'tomomi', group: 'femcare' },
  { id: 'femcare-pro', name: { ja: '美容従事者向けフェムケア', en: 'Femcare for Professionals', ko: '미용 종사자를 위한 펨케어', 'zh-TW': '美容從業者女性照護' }, instructorId: 'tomomi', group: 'femcare' },
];

export const instructors: Instructor[] = [
  {
    id: 'sakura',
    name: 'SAKURA',
    role: { ja: '主講師・サロンオーナー', en: 'Lead Instructor and Salon Owner', ko: '주강사 · 살롱 오너', 'zh-TW': '主講師・沙龍經營者' },
    headline: {
      ja: '日本のサロンの「あたりまえ」を、世界の現場で使える形にして届けます。',
      en: 'Turning the everyday standards of a Japanese salon into skills you can use anywhere.',
      ko: '일본 살롱의 당연한 기준을 세계 현장에서 쓸 수 있는 형태로 전합니다.',
      'zh-TW': '將日本沙龍的理所當然，轉化為世界現場可用的技術。',
    },
    bio: {
      ja: '大阪でビューティーサロンを運営しながら、日本国内外の美容従事者に向けて技術と接客の指導を行っています。技術そのものより「なぜ日本のサロンは選ばれ続けるのか」を分解して伝えることを大切にしています。カウンセリング、衛生管理、サロン空間の整え方、リピートにつながる声かけまで、現場でそのまま使える形にしてお届けします。',
      en: 'While running a beauty salon in Osaka, SAKURA teaches technique and hospitality to beauty professionals in Japan and abroad. Her focus is not the technique alone, but breaking down why Japanese salons keep being chosen — counselling, hygiene, the salon space, and the words that bring guests back.',
      ko: '오사카에서 뷰티 살롱을 운영하며 일본 국내외 미용 종사자에게 기술과 접객을 지도하고 있습니다.',
      'zh-TW': '在大阪經營美容沙龍，同時向日本國內外的美容從業者傳授技術與待客之道。',
    },
    photoUrl: null,
    // 肩書（role）に「サロンオーナー」があるため、ここでは繰り返さない
    credentials: [
      { ja: '日本の現場で実践', en: 'On the salon floor in Japan', ko: '일본 현장에서 실천', 'zh-TW': '在日本現場實踐' },
      { ja: '美容講師', en: 'Beauty instructor', ko: '뷰티 강사', 'zh-TW': '美容講師' },
    ],
    categoryIds: ['salon-standard', 'salon-management', 'omotenashi', 'beauty-skill', 'makeup', 'inbound'],
  },
  {
    id: 'tomomi',
    name: 'TOMOMI',
    role: { ja: 'フェムケア講師', en: 'Femcare Instructor', ko: '펨케어 강사', 'zh-TW': '女性照護講師' },
    headline: {
      ja: '女性の体の変化を知ることは、サロンの提案力そのものになります。',
      en: 'Understanding how a woman’s body changes is what deepens what a salon can offer.',
      ko: '여성의 몸의 변화를 아는 것이 살롱의 제안력이 됩니다.',
      'zh-TW': '了解女性身體的變化，就是沙龍提案力的來源。',
    },
    bio: {
      ja: 'フェムケアの基礎教育を専門とし、美容従事者がお客様のライフステージに合わせた提案をできるようになるための講座を担当しています。更年期前後の体の変化、月経周期と肌の関係など、サロンの現場で聞かれる疑問に答えられる知識を体系的にお伝えします。',
      en: 'TOMOMI specialises in foundational femcare education, helping beauty professionals tailor their advice to each life stage — from menstrual cycles and skin, to the changes around menopause.',
      ko: '펨케어 기초 교육을 전문으로 하며, 미용 종사자가 고객의 라이프 스테이지에 맞춘 제안을 할 수 있도록 돕습니다.',
      'zh-TW': '專精於女性照護基礎教育，協助美容從業者依照顧客的生命階段提出建議。',
    },
    photoUrl: null,
    // 資格・実績が確定するまで「専門家」「スペシャリスト」とは書かない
    credentials: [
      { ja: 'フェムケアを学びながら発信', en: 'Learning and sharing femcare', ko: '펨케어를 배우며 전합니다', 'zh-TW': '一邊學習女性照護一邊分享' },
      { ja: '女性のライフステージを学ぶ', en: "Studying women's life stages", ko: '여성 라이프스테이지를 배웁니다', 'zh-TW': '學習女性的生命階段' },
    ],
    categoryIds: ['femcare-basic', 'life-stage', 'femcare-pro'],
  },
];

/* ---- 講座の組み立てヘルパー（同じ形の繰り返しを避ける） ---- */

const chapter = (id: string, ja: string, en: string, lessons: [string, number][]): Chapter => ({
  id,
  title: { ja, en },
  lessons: lessons.map(([t, m], i) => ({
    id: `${id}-l${i + 1}`,
    title: { ja: t, en: t },
    minutes: m,
    isPreview: id.endsWith('c1') && i === 0,
  })),
});

const materials = (slug: string): Material[] => [
  { id: `${slug}-m1`, courseSlug: slug, type: 'pdf', title: { ja: '講義PDF', en: 'Lecture PDF', ko: '강의 PDF', 'zh-TW': '講義 PDF' }, meta: '全42ページ' },
  { id: `${slug}-m2`, courseSlug: slug, type: 'workbook', title: { ja: 'Workbook', en: 'Workbook', ko: '워크북', 'zh-TW': '練習手冊' }, meta: '書き込み式' },
  { id: `${slug}-m3`, courseSlug: slug, type: 'checklist', title: { ja: 'チェックリスト', en: 'Checklist', ko: '체크리스트', 'zh-TW': '檢核表' }, meta: '現場用' },
  { id: `${slug}-m4`, courseSlug: slug, type: 'transcript', title: { ja: '文字起こし', en: 'Transcript', ko: '스크립트', 'zh-TW': '逐字稿' }, meta: '全Lesson分' },
  { id: `${slug}-m5`, courseSlug: slug, type: 'quiz', title: { ja: '確認テスト', en: 'Quiz', ko: '확인 테스트', 'zh-TW': '測驗' }, meta: '全20問' },
];

const reviews = (a: string, b: string): Review[] => [
  { id: 'r1', author: 'Jasmine L.', country: { ja: 'シンガポール', en: 'Singapore', ko: '싱가포르', 'zh-TW': '新加坡' }, rating: 5, body: { ja: a, en: a } },
  { id: 'r2', author: 'Minji K.', country: { ja: '韓国', en: 'Korea', ko: '한국', 'zh-TW': '韓國' }, rating: 5, body: { ja: b, en: b } },
  { id: 'r3', author: 'Chloe M.', country: { ja: 'オーストラリア', en: 'Australia', ko: '호주', 'zh-TW': '澳洲' }, rating: 4, body: { ja: '自分のサロンにすぐ持ち帰れる内容でした。', en: 'Things I could bring back to my own salon immediately.' } },
];

const faq = [
  {
    q: { ja: '受講期限はありますか？', en: 'Is there a time limit?', ko: '수강 기한이 있나요?', 'zh-TW': '有觀看期限嗎？' },
    a: { ja: 'ありません。ご購入後は無期限で何度でもご視聴いただけます。', en: 'No. After purchase you can watch as many times as you like, with no expiry.', ko: '없습니다. 구매 후 무기한으로 시청하실 수 있습니다.', 'zh-TW': '沒有。購買後可無限期反覆觀看。' },
  },
  {
    q: { ja: '資料はダウンロードできますか？', en: 'Can I download the materials?', ko: '자료를 다운로드할 수 있나요?', 'zh-TW': '可以下載教材嗎？' },
    a: { ja: 'PDF資料は何度でもダウンロードいただけます。動画はストリーミング配信のみです。', en: 'PDF materials can be downloaded as often as you like. Videos are streaming only.', ko: 'PDF 자료는 몇 번이든 다운로드하실 수 있습니다. 영상은 스트리밍만 제공됩니다.', 'zh-TW': 'PDF 教材可無限次下載。影片僅提供串流播放。' },
  },
  {
    q: { ja: '日本語が分からなくても受講できますか？', en: 'Can I take this without Japanese?', ko: '일본어를 몰라도 수강할 수 있나요?', 'zh-TW': '不懂日文也能上課嗎？' },
    a: { ja: '字幕をご用意しています。対応言語は各講座の詳細をご確認ください。', en: 'Subtitles are provided. Please check each course page for available languages.', ko: '자막을 제공합니다. 대응 언어는 각 강좌 상세를 확인해 주세요.', 'zh-TW': '提供字幕，支援語言請見各課程頁面。' },
  },
];

type CourseSeed = Pick<
  Course,
  'slug' | 'title' | 'summary' | 'description' | 'instructorId' | 'categoryId' | 'level' | 'price' | 'isFree' | 'certificate' | 'featured' | 'tone' | 'highlights'
> & {
  chapters: Chapter[];
  translation: Course['translation'];
  languages: Course['languages'];
  rating: number;
  reviewCount: number;
  studentCount: number;
};

const build = (s: CourseSeed): Course => {
  const lessonCount = s.chapters.reduce((n, c) => n + c.lessons.length, 0);
  const totalMinutes = s.chapters.reduce((n, c) => n + c.lessons.reduce((m, l) => m + l.minutes, 0), 0);
  return {
    ...s,
    lessonCount,
    totalMinutes,
    curriculum: s.chapters,
    materials: materials(s.slug),
    reviews: reviews(
      '説明が具体的で、翌日から接客が変わりました。',
      '「なぜそうするのか」まで教えてくれるのが良かったです。',
    ),
    faq,
    publishedAt: '2026-06-01',
  };
};

const full = (master: string): Course['translation'] => ({
  masterUpdatedAt: master,
  translations: {
    en: { updatedAt: master },
    ko: { updatedAt: master },
    'zh-TW': { updatedAt: master },
  },
});

export const courses: Course[] = [
  build({
    slug: 'japanese-salon-standard',
    title: { ja: '日本式サロンスタンダード 基礎', en: 'Japanese Salon Standards: Foundations', ko: '일본식 살롱 스탠다드 기초', 'zh-TW': '日式沙龍標準｜基礎' },
    summary: { ja: '清潔感・所作・空間づくり。日本のサロンが選ばれ続ける土台をつくります。', en: 'Cleanliness, conduct and space — the foundation behind why Japanese salons keep being chosen.', ko: '청결감·동작·공간 만들기. 일본 살롱이 선택받는 토대를 만듭니다.', 'zh-TW': '清潔感、儀態、空間營造，打造日式沙龍的基礎。' },
    description: { ja: '技術が同じでも、日本のサロンが「また来たい」と言われるのはなぜか。その差は、目に見えにくい基準の積み重ねにあります。この講座では、清掃と衛生管理の基準、道具の置き方、お客様の前での所作、席へのご案内、声のトーンまでを分解し、あなたのサロンでそのまま運用できるチェックリストに落とし込みます。', en: 'Why do guests say “I want to come back” to a Japanese salon, even when the technique is the same? The difference lies in standards that are hard to see. This course breaks down hygiene, tool placement, conduct in front of the guest, seating and tone of voice into a checklist you can run in your own salon.' },
    instructorId: 'sakura', categoryId: 'salon-standard', level: 'beginner',
    price: { JPY: 19800, USD: 148, KRW: 189000, TWD: 4200 }, isFree: false,
    certificate: 'completion', featured: true, tone: 0,
    highlights: { ja: ['清掃・衛生管理の日本基準を数値で理解する', '道具と什器の配置が与える印象を設計する', '初回来店から次回予約までの声かけを組み立てる'], en: ['Understand Japanese hygiene standards in concrete numbers', 'Design the impression created by tools and fixtures', 'Build the words that lead from first visit to next booking'] },
    languages: ['ja', 'en', 'ko', 'zh-TW'], rating: 4.9, reviewCount: 128, studentCount: 412,
    translation: full('2026-07-20'),
    chapters: [
      chapter('c1', '日本のサロンの前提', 'The premise of a Japanese salon', [['なぜ清潔感が最優先なのか', 8], ['お客様が見ている3つの場所', 9], ['基準を言語化する', 7]]),
      chapter('c2', '衛生管理の実務', 'Hygiene in practice', [['施術前後の手順', 11], ['道具の消毒と保管', 10], ['記録の残し方', 8]]),
      chapter('c3', '空間と所作', 'Space and conduct', [['席へのご案内', 9], ['声のトーンと距離', 10], ['退店までの動線', 8]]),
    ],
  }),
  build({
    slug: 'omotenashi-counselling',
    title: { ja: 'おもてなしカウンセリング', en: 'Omotenashi Counselling', ko: '오모테나시 카운슬링', 'zh-TW': '款待式諮詢' },
    summary: { ja: '聞く順番を変えるだけで、提案は通ります。日本式カウンセリングの型。', en: 'Change the order you ask, and your suggestions land. The Japanese counselling framework.', ko: '묻는 순서를 바꾸는 것만으로 제안이 통합니다.', 'zh-TW': '只要改變提問順序，提案就能被接受。' },
    description: { ja: 'カウンセリングは質問の数ではなく順番で決まります。お客様が本当の要望を話せる状態をつくるための問診設計、言いにくいことの伝え方、提案が押し売りにならない線引きを、実際の会話例とともに学びます。', en: 'Counselling is decided by the order of your questions, not the number. Learn how to create the state where a guest can voice what they really want, how to say difficult things, and where the line is before a suggestion becomes a hard sell.' },
    instructorId: 'sakura', categoryId: 'omotenashi', level: 'intermediate',
    price: { JPY: 24800, USD: 186, KRW: 236000, TWD: 5300 }, isFree: false,
    certificate: 'certification', featured: true, tone: 1,
    highlights: { ja: ['要望を引き出す問診の順番を設計する', '言いにくい提案を角を立てずに伝える', '押し売りにならない店販の線引きを持つ'], en: ['Design the question order that draws out real needs', 'Deliver difficult suggestions without friction', 'Hold a clear line so retail never feels pushy'] },
    languages: ['ja', 'en', 'ko'], rating: 4.8, reviewCount: 96, studentCount: 287,
    translation: { masterUpdatedAt: '2026-08-28', translations: { en: { updatedAt: '2026-08-28' }, ko: { updatedAt: '2026-05-10' } } },
    chapters: [
      chapter('c1', 'カウンセリングの構造', 'The structure of counselling', [['最初の3分で決まること', 9], ['質問の順番を設計する', 11], ['沈黙の使い方', 7]]),
      chapter('c2', '提案に変える', 'Turning it into a proposal', [['言いにくいことを伝える', 10], ['店販につなげる線引き', 9], ['次回予約の自然な流れ', 8]]),
    ],
  }),
  build({
    slug: 'salon-management-basics',
    title: { ja: '日本式サロン経営の基礎', en: 'Japanese Salon Management: Basics', ko: '일본식 살롱 경영 기초', 'zh-TW': '日式沙龍經營基礎' },
    summary: { ja: '価格・リピート・スタッフ教育。小さなサロンが続く仕組みをつくる。', en: 'Pricing, repeat visits and staff training — the system that keeps a small salon going.', ko: '가격·재방문·스태프 교육. 작은 살롱이 지속되는 구조.', 'zh-TW': '定價、回訪、員工教育：小型沙龍持續經營的機制。' },
    description: { ja: '席数が少ないサロンほど、仕組みが利益を決めます。価格の決め方、リピート率の見方、スタッフに任せるための教育手順を、実際の数字の見方とあわせて学びます。', en: 'The fewer seats you have, the more your systems decide your profit. Learn how to set prices, read repeat rates, and train staff so you can delegate.' },
    instructorId: 'sakura', categoryId: 'salon-management', level: 'advanced',
    price: { JPY: 34800, USD: 262, KRW: 332000, TWD: 7400 }, isFree: false,
    certificate: 'certification', featured: true, tone: 2,
    highlights: { ja: ['原価と時間から適正価格を出す', 'リピート率を分解して改善点を見つける', 'スタッフ教育を手順書に落とす'], en: ['Derive fair pricing from cost and time', 'Break down repeat rates to find what to fix', 'Turn staff training into a written procedure'] },
    languages: ['ja', 'en'], rating: 4.7, reviewCount: 54, studentCount: 143,
    translation: { masterUpdatedAt: '2026-08-30', translations: { en: { updatedAt: '2026-08-30' } } },
    chapters: [
      chapter('c1', '数字を読む', 'Reading the numbers', [['席数と回転から考える', 10], ['原価と時間の計算', 12], ['値上げの伝え方', 9]]),
      chapter('c2', '人を育てる', 'Growing your team', [['手順書のつくり方', 11], ['評価とフィードバック', 10]]),
    ],
  }),
  build({
    slug: 'eyelash-technique',
    title: { ja: '日本のまつげ技術 実践', en: 'Japanese Eyelash Technique', ko: '일본 속눈썹 기술 실전', 'zh-TW': '日本睫毛技術實務' },
    summary: { ja: '持ちを左右するのは接着ではなく前処理。日本の現場基準を手順で学ぶ。', en: 'Retention is decided by prep, not glue. Learn the Japanese standard, step by step.', ko: '유지력을 좌우하는 것은 접착이 아니라 전처리입니다.', 'zh-TW': '決定持久度的是前置處理，而非黏著。' },
    description: { ja: '仕上がりの美しさよりも、2週間後の状態で評価されるのが日本のまつげ施術です。毛周期の見立て、前処理、接着の量、アフターカウンセリングまでを一連の手順として学びます。', en: 'Japanese lash work is judged by how it looks two weeks later, not on the day. Learn cycle assessment, preparation, adhesive volume and after-care as one connected procedure.' },
    instructorId: 'sakura', categoryId: 'beauty-skill', level: 'intermediate',
    price: { JPY: 29800, USD: 224, KRW: 284000, TWD: 6300 }, isFree: false,
    certificate: 'completion', featured: false, tone: 3,
    highlights: { ja: ['毛周期から本数と太さを決める', '前処理で持ちを2週間伸ばす', 'アフターカウンセリングの型'], en: ['Decide count and thickness from the lash cycle', 'Add two weeks of retention through preparation', 'A framework for after-care counselling'] },
    languages: ['ja', 'en', 'zh-TW'], rating: 4.9, reviewCount: 211, studentCount: 508,
    translation: { masterUpdatedAt: '2026-07-02', translations: { en: { updatedAt: '2026-07-02' }, 'zh-TW': { updatedAt: '2026-07-02' } } },
    chapters: [
      chapter('c1', '見立てる', 'Assessment', [['毛周期を読む', 9], ['お客様の希望と現実の差', 8]]),
      chapter('c2', '施術する', 'The procedure', [['前処理の手順', 12], ['接着の量と位置', 11], ['仕上げの確認', 7]]),
      chapter('c3', '次につなげる', 'The follow-through', [['アフターカウンセリング', 9], ['ホームケアの伝え方', 8]]),
    ],
  }),
  build({
    slug: 'brow-design',
    title: { ja: '眉デザインの考え方', en: 'Designing Brows', ko: '눈썹 디자인의 사고법', 'zh-TW': '眉型設計思維' },
    summary: { ja: '左右対称ではなく骨格に合わせる。日本式の眉設計。', en: 'Match the bone structure, not symmetry. Japanese brow design.', ko: '좌우대칭이 아니라 골격에 맞춥니다.', 'zh-TW': '不追求左右對稱，而是順應骨架。' },
    description: { ja: '眉は左右対称に整えるほど不自然になります。骨格・目の位置・表情の癖から、その人だけの眉を設計する手順を学びます。', en: 'The more symmetrical you make brows, the less natural they look. Learn to design brows from bone structure, eye position and habitual expression.' },
    instructorId: 'sakura', categoryId: 'beauty-skill', level: 'beginner',
    price: { JPY: 16800, USD: 126, KRW: 160000, TWD: 3600 }, isFree: false,
    certificate: 'completion', featured: false, tone: 1,
    highlights: { ja: ['骨格から眉山の位置を決める', '表情の癖を読む', '仕上がりを言葉で説明する'], en: ['Set the arch from bone structure', 'Read habitual expression', 'Explain the result in words'] },
    languages: ['ja', 'en'], rating: 4.6, reviewCount: 71, studentCount: 226,
    translation: { masterUpdatedAt: '2026-06-18', translations: { en: { updatedAt: '2026-06-18' } } },
    chapters: [
      chapter('c1', '設計する', 'Designing', [['骨格の見方', 10], ['眉山と眉尻', 9]]),
      chapter('c2', '仕上げる', 'Finishing', [['左右差の扱い', 8], ['説明の仕方', 7]]),
    ],
  }),
  build({
    slug: 'makeup-for-photo',
    title: { ja: '写真に強いメイク', en: 'Makeup That Photographs Well', ko: '사진에 강한 메이크업', 'zh-TW': '上鏡妝容' },
    summary: { ja: 'SNSで選ばれるサロンの、光を計算したメイク設計。', en: 'Light-aware makeup design for salons chosen on social media.', ko: 'SNS에서 선택받는 살롱의 빛을 계산한 메이크업.', 'zh-TW': '為社群而生、計算光線的妝容設計。' },
    description: { ja: '目の前では美しいのに写真では沈む。その原因は光の反射設計にあります。撮影を前提としたベース設計と、サロンの照明の整え方を学びます。', en: 'Beautiful in person, flat in photos — the cause is how light reflects. Learn base design for the camera and how to set your salon lighting.' },
    instructorId: 'sakura', categoryId: 'makeup', level: 'intermediate',
    price: { JPY: 22800, USD: 171, KRW: 217000, TWD: 4900 }, isFree: false,
    certificate: 'completion', featured: false, tone: 2,
    highlights: { ja: ['光の反射からベースを設計する', 'サロン照明を撮影向きに整える', '色が沈まない仕上げ'], en: ['Design the base around light reflection', 'Tune salon lighting for the camera', 'Finishes that keep colour alive'] },
    languages: ['ja', 'en', 'ko', 'zh-TW'], rating: 4.7, reviewCount: 88, studentCount: 301,
    translation: full('2026-06-25'),
    chapters: [
      chapter('c1', '光を知る', 'Understanding light', [['照明と肌の関係', 9], ['反射のコントロール', 10]]),
      chapter('c2', '撮る', 'Shooting', [['サロンでの撮影設定', 8], ['仕上げの確認', 7]]),
    ],
  }),
  build({
    slug: 'inbound-guest',
    title: { ja: 'インバウンド接客の基礎', en: 'Serving International Guests', ko: '인바운드 접객 기초', 'zh-TW': '接待外國顧客基礎' },
    summary: { ja: '言葉が通じなくても伝わる、日本のサロンの接客設計。', en: 'Japanese salon service that lands even without a shared language.', ko: '말이 통하지 않아도 전해지는 접객 설계.', 'zh-TW': '即使語言不通也能傳達的接待設計。' },
    description: { ja: '海外からのお客様に必要なのは翻訳ではなく、迷わせない設計です。予約から会計までの導線、指差しで伝わる資料の作り方、宗教・文化への配慮を学びます。', en: 'International guests need a journey without confusion more than they need translation. Learn the path from booking to payment, point-and-show materials, and cultural considerations.' },
    instructorId: 'sakura', categoryId: 'inbound', level: 'beginner',
    price: { JPY: 14800, USD: 111, KRW: 141000, TWD: 3200 }, isFree: false,
    certificate: 'completion', featured: false, tone: 0,
    highlights: { ja: ['迷わせない予約から会計までの導線', '指差しで伝わる資料をつくる', '文化・宗教への配慮'], en: ['A confusion-free path from booking to payment', 'Build point-and-show materials', 'Cultural and religious considerations'] },
    languages: ['ja', 'en', 'ko', 'zh-TW'], rating: 4.5, reviewCount: 42, studentCount: 176,
    translation: { masterUpdatedAt: '2026-09-01', translations: { en: { updatedAt: '2026-06-01' }, ko: { updatedAt: '2026-06-01' }, 'zh-TW': { updatedAt: '2026-06-01' } } },
    chapters: [
      chapter('c1', '迎える', 'Welcoming', [['予約時に伝えること', 8], ['来店から着席まで', 9]]),
      chapter('c2', '伝える', 'Communicating', [['指差し資料のつくり方', 10], ['配慮すべきこと', 8]]),
    ],
  }),
  build({
    slug: 'femcare-basics',
    title: { ja: 'フェムケア基礎', en: 'Femcare Basics', ko: '펨케어 기초', 'zh-TW': '女性照護基礎' },
    summary: { ja: '月経周期と肌・体調の関係を、サロンの提案に変える。', en: 'Turn the link between cycle, skin and condition into salon advice.', ko: '월경 주기와 피부·컨디션의 관계를 제안으로.', 'zh-TW': '將月經週期與肌膚狀況的關聯轉為提案。' },
    description: { ja: 'お客様の肌の調子が毎回違う理由の多くは、周期にあります。基礎知識を体系的に押さえ、サロンで踏み込みすぎずに提案するための境界線を学びます。', en: 'Much of why a guest’s skin differs each visit comes down to their cycle. Build the foundational knowledge, and learn where the line is when advising in a salon.' },
    instructorId: 'tomomi', categoryId: 'femcare-basic', level: 'beginner',
    price: { JPY: 18800, USD: 141, KRW: 179000, TWD: 4000 }, isFree: false,
    certificate: 'completion', featured: true, tone: 1,
    highlights: { ja: ['月経周期と肌の変化を結びつける', '踏み込みすぎない提案の境界線', 'お客様への言葉の選び方'], en: ['Connect the cycle to changes in the skin', 'Know the line you should not cross', 'Choose your words with care'] },
    languages: ['ja', 'en', 'ko'], rating: 4.8, reviewCount: 64, studentCount: 198,
    translation: { masterUpdatedAt: '2026-07-15', translations: { en: { updatedAt: '2026-07-15' }, ko: { updatedAt: '2026-07-15' } } },
    chapters: [
      chapter('c1', '体を知る', 'Understanding the body', [['月経周期の基礎', 10], ['肌と体調の変化', 9]]),
      chapter('c2', '伝える', 'Advising', [['サロンで話せること・話せないこと', 11], ['言葉の選び方', 8]]),
    ],
  }),
  build({
    slug: 'life-stage-care',
    title: { ja: '女性のライフステージとケア', en: 'Life Stages and Care', ko: '여성의 라이프 스테이지와 케어', 'zh-TW': '女性生命階段與照護' },
    summary: { ja: '20代から更年期前後まで。年代で変わる提案の軸を持つ。', en: 'From the twenties through menopause — an advisory axis that shifts with age.', ko: '20대부터 갱년기 전후까지 연령별 제안 축.', 'zh-TW': '從20代到更年期前後，依年齡調整提案。' },
    description: { ja: '同じ施術でも、年代によって喜ばれる理由は変わります。ライフステージごとの体の変化と、サロンでの提案の軸を整理します。', en: 'The same treatment is appreciated for different reasons at different ages. Organise the physical changes of each life stage, and the advisory axis that follows.' },
    instructorId: 'tomomi', categoryId: 'life-stage', level: 'intermediate',
    price: { JPY: 21800, USD: 164, KRW: 208000, TWD: 4600 }, isFree: false,
    certificate: 'completion', featured: false, tone: 3,
    highlights: { ja: ['年代ごとの体の変化を整理する', '更年期前後の基礎知識', '提案の軸を年代で切り替える'], en: ['Organise the changes of each decade', 'Foundations around menopause', 'Switch your advisory axis by age'] },
    languages: ['ja', 'en'], rating: 4.7, reviewCount: 38, studentCount: 121,
    translation: { masterUpdatedAt: '2026-08-05', translations: { en: { updatedAt: '2026-08-05' } } },
    chapters: [
      chapter('c1', '年代を知る', 'Knowing the decades', [['20代〜30代', 9], ['40代以降', 10]]),
      chapter('c2', '提案する', 'Advising', [['更年期前後の配慮', 11], ['続けられるケア', 8]]),
    ],
  }),
  build({
    slug: 'femcare-for-pros',
    title: { ja: '美容従事者のためのフェムケア実践', en: 'Femcare for Beauty Professionals', ko: '미용 종사자를 위한 펨케어 실전', 'zh-TW': '美容從業者的女性照護實務' },
    summary: { ja: 'サロンで実際に聞かれる質問に、根拠を持って答えられるようになる。', en: 'Answer the questions guests actually ask, with grounding.', ko: '살롱에서 실제로 받는 질문에 근거를 갖고 답합니다.', 'zh-TW': '面對顧客的實際提問，能有根據地回答。' },
    description: { ja: '「これは相談していいことなのか」とお客様が迷う領域こそ、サロンの信頼が決まる場所です。よくある質問と、答えてよい範囲を整理します。', en: 'Trust is decided in the areas where guests hesitate to ask. Organise the common questions and the range you can safely answer.' },
    instructorId: 'tomomi', categoryId: 'femcare-pro', level: 'advanced',
    price: { JPY: 27800, USD: 209, KRW: 265000, TWD: 5900 }, isFree: false,
    certificate: 'certification', featured: false, tone: 2,
    highlights: { ja: ['よくある質問と回答の範囲', '医療との線引き', '記録と引き継ぎ'], en: ['Common questions and safe answers', 'The line with medical advice', 'Records and handover'] },
    languages: ['ja', 'en'], rating: 4.9, reviewCount: 29, studentCount: 84,
    translation: { masterUpdatedAt: '2026-08-22', translations: {} },
    chapters: [
      chapter('c1', '答える', 'Answering', [['よくある質問', 11], ['医療との線引き', 10]]),
      chapter('c2', '残す', 'Recording', [['記録の残し方', 9]]),
    ],
  }),
  build({
    slug: 'salon-space-design',
    title: { ja: 'サロン空間のつくり方', en: 'Designing the Salon Space', ko: '살롱 공간 만들기', 'zh-TW': '沙龍空間營造' },
    summary: { ja: '香り・音・光・視線。空間が伝える「丁寧さ」を設計する。', en: 'Scent, sound, light and sightlines — designing the care a space conveys.', ko: '향기·소리·빛·시선. 공간이 전하는 정중함.', 'zh-TW': '香氣、聲音、光線、視線：設計空間傳達的細膩。' },
    description: { ja: 'お客様は入店から数秒でサロンの丁寧さを判断しています。香り、音、光、視線の抜け方を、費用をかけずに整える方法を学びます。', en: 'Guests judge how careful a salon is within seconds of entering. Learn to tune scent, sound, light and sightlines without spending much.' },
    instructorId: 'sakura', categoryId: 'salon-standard', level: 'beginner',
    price: { JPY: 0 }, isFree: true,
    certificate: null, featured: false, tone: 0,
    highlights: { ja: ['入店数秒で伝わるものを知る', '費用をかけずに整える', '視線の抜け方を設計する'], en: ['Know what lands in the first seconds', 'Improve without spending', 'Design where the eye travels'] },
    languages: ['ja', 'en', 'ko', 'zh-TW'], rating: 4.6, reviewCount: 156, studentCount: 892,
    translation: full('2026-05-30'),
    chapters: [
      chapter('c1', '整える', 'Setting the space', [['香りと音', 8], ['光と視線', 9]]),
    ],
  }),
  build({
    slug: 'repeat-and-retail',
    title: { ja: 'リピートと店販の考え方', en: 'Repeat Visits and Retail', ko: '재방문과 매장 판매', 'zh-TW': '回訪與店販思維' },
    summary: { ja: '売り込まずに続く。日本のサロンのリピート設計。', en: 'Continuity without selling — the Japanese approach to repeat business.', ko: '팔지 않고 이어지는 재방문 설계.', 'zh-TW': '不推銷也能延續的回訪設計。' },
    description: { ja: 'リピートは技術の結果ではなく設計の結果です。次回来店の理由づくり、店販を「押し売り」にしない伝え方を学びます。', en: 'Repeat visits are the result of design, not technique. Learn to create a reason to return and to talk about products without pushing.' },
    instructorId: 'sakura', categoryId: 'salon-management', level: 'intermediate',
    price: { JPY: 19800, USD: 148, KRW: 189000, TWD: 4200 }, isFree: false,
    certificate: 'completion', featured: false, tone: 1,
    highlights: { ja: ['次回来店の理由をつくる', '店販の伝え方', '数字で効果を確認する'], en: ['Create a reason to return', 'How to talk about products', 'Confirm the effect in numbers'] },
    languages: ['ja', 'en', 'ko'], rating: 4.6, reviewCount: 47, studentCount: 165,
    translation: { masterUpdatedAt: '2026-07-28', translations: { en: { updatedAt: '2026-07-28' }, ko: { updatedAt: '2026-07-28' } } },
    chapters: [
      chapter('c1', '設計する', 'Designing', [['次回の理由', 9], ['声かけの型', 10]]),
      chapter('c2', '確かめる', 'Verifying', [['リピート率の見方', 8]]),
    ],
  }),
];

export const freeContents: FreeContent[] = [
  { id: 'f1', type: 'video', title: { ja: '日本のサロンが清潔感を最優先する理由', en: 'Why Japanese salons put cleanliness first', ko: '일본 살롱이 청결감을 최우선하는 이유', 'zh-TW': '日式沙龍為何最重視清潔感' }, summary: { ja: '5分で分かる、日本式サロンの前提。', en: 'The premise of a Japanese salon, in five minutes.', ko: '5분으로 이해하는 일본식 살롱의 전제.', 'zh-TW': '五分鐘理解日式沙龍的前提。' }, instructorId: 'sakura', minutes: 5, tone: 0 },
  { id: 'f2', type: 'article', title: { ja: 'カウンセリングで最初に聞くべき質問', en: 'The first question to ask in counselling', ko: '카운슬링에서 가장 먼저 물어야 할 질문', 'zh-TW': '諮詢時該先問的問題' }, summary: { ja: '順番を変えるだけで会話が変わります。', en: 'Change the order and the conversation changes.', ko: '순서를 바꾸는 것만으로 대화가 달라집니다.', 'zh-TW': '只要改變順序，對話就會不同。' }, instructorId: 'sakura', minutes: 4, tone: 1 },
  { id: 'f3', type: 'pdf', title: { ja: '衛生管理チェックリスト（無料配布）', en: 'Hygiene checklist (free download)', ko: '위생 관리 체크리스트 (무료)', 'zh-TW': '衛生管理檢核表（免費）' }, summary: { ja: '毎日の確認項目を1枚にまとめました。', en: 'Your daily checks, on a single sheet.', ko: '매일 확인 항목을 한 장에 정리했습니다.', 'zh-TW': '將每日確認項目整理成一頁。' }, instructorId: 'sakura', minutes: 2, tone: 2 },
  { id: 'f4', type: 'video', title: { ja: '月経周期と肌の関係を3分で', en: 'Cycle and skin, in three minutes', ko: '월경 주기와 피부의 관계 3분 정리', 'zh-TW': '三分鐘看懂週期與肌膚' }, summary: { ja: 'フェムケアのいちばん最初の一歩。', en: 'The very first step into femcare.', ko: '펨케어의 첫걸음.', 'zh-TW': '女性照護的第一步。' }, instructorId: 'tomomi', minutes: 3, tone: 3 },
  { id: 'f5', type: 'article', title: { ja: '海外のお客様を迷わせない店内表示', en: 'In-salon signage that avoids confusion', ko: '해외 고객이 헤매지 않는 안내 표시', 'zh-TW': '不讓外國顧客迷惑的店內標示' }, summary: { ja: '翻訳より先にできることがあります。', en: 'There is something to do before translating.', ko: '번역보다 먼저 할 수 있는 일이 있습니다.', 'zh-TW': '在翻譯之前，還有能做的事。' }, instructorId: 'sakura', minutes: 6, tone: 0 },
];
