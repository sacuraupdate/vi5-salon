/* ドメイン型。Phase 2 の DB スキーマの下敷きになるため Phase 1 でも正確に定義する。 */

export const LOCALES = ['ja', 'en', 'ko', 'zh-TW'] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * 多言語テキスト。日本語(ja)を必須にすることで
 * 「日本語が原本(MASTER)」という原則を型レベルで担保する。
 */
export type Localized<T = string> = { ja: T } & Partial<Record<Exclude<Locale, 'ja'>, T>>;

/** 翻訳の鮮度。原本の更新時刻と翻訳の更新時刻を比較して状態を導出する。 */
export type TranslationMeta = {
  masterUpdatedAt: string;
  translations: Partial<Record<Exclude<Locale, 'ja'>, { updatedAt: string }>>;
};

export type TranslationStatus = 'translated' | 'outdated' | 'missing';

/** 市場ごとの独立価格。為替換算では生成しない（最小通貨単位の整数）。 */
export type CurrencyCode = 'JPY' | 'USD' | 'KRW' | 'TWD';
export type Price = { JPY: number } & Partial<Record<Exclude<CurrencyCode, 'JPY'>, number>>;

export type InstructorId = 'sakura' | 'tomomi';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * 講座の言語ごとの公開状態。
 * 顧客に見せてよいのは 'published' のみ。'in-production' は制作中、'planned' は着手前。
 * 日本語が完成しても他言語は未完成、という状態を正しく持てるようにする。
 */
export type CourseLocaleStatus = 'published' | 'in-production' | 'planned';

/** 修了証(completion) と 認定証(certification) は明確に別物として扱う。 */
export type CertificateKind = 'completion' | 'certification';

export type CategoryId =
  | 'salon-standard'
  | 'salon-management'
  | 'omotenashi'
  | 'beauty-skill'
  | 'makeup'
  | 'inbound'
  | 'femcare-basic'
  | 'life-stage'
  | 'femcare-pro';

export type Category = {
  id: CategoryId;
  name: Localized;
  instructorId: InstructorId;
  /** TOP に出す 4 つの大分類 */
  group: 'japanese-salon' | 'management' | 'technique' | 'femcare';
};

export type Instructor = {
  id: InstructorId;
  name: string;
  role: Localized;
  headline: Localized;
  bio: Localized;
  photoUrl: string | null;
  /**
   * 講師の信頼情報。事実として確認できることだけを置く。
   * 受講者数・指導年数などの実績数値は、確認が取れるまで持たせない。
   * 3項目以内。同じ意味を重ねない。
   */
  credentials: Localized[];
  categoryIds: CategoryId[];
};

export type MaterialType = 'pdf' | 'workbook' | 'checklist' | 'transcript' | 'quiz';

export type Material = {
  id: string;
  courseSlug: string;
  type: MaterialType;
  title: Localized;
  meta: string;
  /**
   * 'planned' は実ファイルがまだ無い教材。
   * ダウンロード導線を作らず「付属予定」として表示する。未指定は提供済み。
   */
  status?: 'available' | 'planned';
};

export type Lesson = {
  id: string;
  title: Localized;
  minutes: number;
  isPreview: boolean;
};

export type Chapter = {
  id: string;
  title: Localized;
  lessons: Lesson[];
  /**
   * 'in-production' は制作中の章。「順次公開」と明示し、公開済みと混同させない。
   * 未指定は公開済み。
   */
  status?: 'published' | 'in-production';
};

/**
 * 修了証の発行条件になる最終テスト。
 * 講座ごとに問題数・合格ラインが違うため、講座に持たせる。
 */
export type Assessment = {
  questions: number;
  /** 合格に必要な正答率（%） */
  passPercent: number;
  /** 合格に必要な正答数。passPercent から導出せず、明示して丸め誤差を避ける */
  passQuestions: number;
  /** 再受験の条件。現在は無料・回数制限なしのみ */
  retake: 'unlimited-free';
};

export type Review = {
  id: string;
  author: string;
  country: Localized;
  rating: number;
  body: Localized;
};

export type Course = {
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  instructorId: InstructorId;
  categoryId: CategoryId;
  level: CourseLevel;
  price: Price;
  isFree: boolean;
  lessonCount: number;
  totalMinutes: number;
  /** 実際に視聴できる言語（字幕含む） */
  languages: Locale[];
  certificate: CertificateKind | null;
  featured: boolean;
  rating: number;
  reviewCount: number;
  studentCount: number;
  /** 正式素材が入るまでのプレースホルダ配色（0-3） */
  tone: number;
  highlights: Localized<string[]>;
  /** 誰のための講座か。講座ごとに明示する（カテゴリーからの推測に頼らない） */
  audience?: Localized<string[]>;
  /** 最終テスト。ある場合、修了証は合格者のみ発行 */
  assessment?: Assessment;
  /**
   * 言語ごとの公開状態。未指定は languages がそのまま公開済み（既存講座の互換）。
   * 指定した場合、'published' の言語だけが顧客向けに公開される。
   * 言語ごとに独立しているため、日本語だけ先に公開して後から英語を足せる。
   */
  availability?: Partial<Record<Locale, CourseLocaleStatus>>;
  /**
   * 価格の確定状態。'draft' は仮価格で、購入できない。
   * 国別固定価格を決めたら 'confirmed' にする。
   */
  priceStatus?: 'draft' | 'confirmed';
  /**
   * 修了後に別途受験できる「認定サロン」の対象講座かどうか。
   * 講座単位の認定証（certificate: 'certification'）とは別物。混同させない。
   */
  salonCertification?: boolean;
  curriculum: Chapter[];
  materials: Material[];
  reviews: Review[];
  faq: { q: Localized; a: Localized }[];
  translation: TranslationMeta;
  publishedAt: string;
};

export type FreeContentType = 'video' | 'article' | 'pdf';

export type FreeContent = {
  id: string;
  type: FreeContentType;
  title: Localized;
  summary: Localized;
  instructorId: InstructorId;
  minutes: number;
  tone: number;
};

/* ---------- 受講者（マイページ） ---------- */

export type Enrollment = {
  courseSlug: string;
  progressPercent: number;
  lastLessonId: string;
  lastLessonTitle: Localized;
  lastStudiedAt: string;
  completedAt: string | null;
};

export type Certificate = {
  id: string;
  kind: CertificateKind;
  courseSlug: string;
  holderName: string;
  instructorId: InstructorId;
  issuedAt: string;
};

export type LearnerProfile = {
  name: string;
  email: string;
  country: Localized;
  memberSince: string;
};

/* ---------- 管理画面 ---------- */

export type AdminRole = 'owner' | 'instructor';

export type SalesSummary = {
  todayJpy: number;
  monthJpy: number;
  monthDiffPercent: number;
  newStudents: number;
  openTaskCount: number;
};

export type DailySales = { date: string; jpy: number };

export type CourseSales = {
  courseSlug: string;
  title: Localized;
  instructorId: InstructorId;
  orders: number;
  jpy: number;
};

export type CountrySales = { country: Localized; orders: number; jpy: number };

export type AdminTask = {
  id: string;
  title: string;
  kind: 'inquiry' | 'course' | 'certificate' | 'post' | 'system';
  dueLabel: string;
  urgent: boolean;
  instructorId: InstructorId | null;
};

export type Inquiry = {
  id: string;
  name: string;
  country: Localized;
  language: Locale;
  subject: string;
  receivedAt: string;
  status: 'open' | 'answered';
  instructorId: InstructorId | null;
};

export type Student = {
  id: string;
  name: string;
  country: Localized;
  language: Locale;
  courseCount: number;
  progressPercent: number;
  joinedAt: string;
  instructorIds: InstructorId[];
};
