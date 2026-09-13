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

/** 通貨。表示単位の整数で扱う（小数は使わない）。 */
export type CurrencyCode = 'JPY' | 'USD' | 'KRW' | 'TWD';

/**
 * 販売市場。**言語とは独立**して扱う。
 * 「英語＝アメリカ＝USD」のような固定をしないため、locale ではなく market で価格を引く。
 */
export type MarketId = 'global-usd' | 'tw' | 'kr' | 'jp';

/**
 * 1市場ぶんの固定価格。**為替換算では生成しない。**
 * list = 通常価格 / launch = ローンチ価格（任意）。金額は表示単位の整数。
 *
 * priceId / launchPriceId は Stripe の Price ID（`price_...`）。
 * Stripe の Price は金額が固定のため、通常価格とローンチ価格で別のIDになる。
 * **未設定の市場では購入手続きに進めない**（金額だけあってもチェックアウトを作らない）。
 */
export type MarketPrice = {
  list: number;
  launch?: number;
  /** 通常価格に対応する Stripe Price ID */
  priceId?: string;
  /** ローンチ価格に対応する Stripe Price ID */
  launchPriceId?: string;
};

/**
 * 講座の価格設定。市場ごとに独立して設定でき、未設定の市場では販売しない。
 * status: 'draft' の間は金額を顧客に出さず、購入もできない。
 */
export type Pricing = {
  status: 'draft' | 'confirmed';
  /** 市場ごとの固定価格。ここに無い市場は「準備中」扱い（日本円へ落とさない） */
  byMarket: Partial<Record<MarketId, MarketPrice>>;
  /** ローンチ価格の終了日（YYYY-MM-DD）。未指定なら終了日なし */
  launchEndsAt?: string | null;
};

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

/**
 * 動画の配信元。現在は YouTube 限定公開のみ。
 * 将来 Mux 等へ移す際は provider を足し、参照側は `src/lib/video.ts` だけを直せばよい。
 */
export type VideoProvider = 'youtube';

/**
 * 章に紐づく動画。id は SAKURA が後から登録する（未登録は null）。
 * **この値はサーバー側で購入権限を確認したあとにだけ画面へ渡す。**
 */
export type VideoRef = {
  provider: VideoProvider;
  /** YouTube の動画ID（限定公開）。null = 未登録 */
  id: string | null;
  /** 字幕を用意できている言語 */
  captions: Locale[];
};

export type Chapter = {
  id: string;
  title: Localized;
  /** 章の説明。販売ページと受講画面の両方で使う */
  description?: Localized;
  lessons: Lesson[];
  /**
   * 'in-production' は制作中の章。「順次公開」と明示し、公開済みと混同させない。
   * 未指定は公開済み。
   */
  status?: 'published' | 'in-production';
  /** 章の動画。未指定は動画なし */
  video?: VideoRef;
  /** 章に紐づく教材。未指定は講座共通の教材を使う */
  materials?: Material[];
  /** 章ごとの言語別公開状況。未指定は講座の availability に従う */
  availability?: Partial<Record<Locale, CourseLocaleStatus>>;
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
  /** 価格設定。market ごとの固定価格と、通常価格／ローンチ価格を持つ */
  pricing: Pricing;
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
   * 修了後に別途受験できる「認定サロン」の対象講座かどうか。
   * 講座単位の認定証（certificate: 'certification'）とは別物。混同させない。
   */
  salonCertification?: boolean;
  /**
   * 一般ユーザーに見せない講座。
   * 確認用のサンプルなど、実体が無いものに付ける。
   * true の講座は、公開一覧・検索・おすすめ・講師ページ・購入導線のすべてに出ない。
   * **データは消さない。** 管理画面からは引き続き確認でき、
   * 既に購入済みの人の受講画面も開ける（出品を止めるだけで、権利は取り上げない）。
   */
  unlisted?: boolean;
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
  /** 一般ユーザーに見せない。実体が無い確認用データに付ける */
  unlisted?: boolean;
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

/** 投稿の状態。公開済みと予約を混同させない */
export type PostStatus = 'draft' | 'scheduled' | 'published';

/** 発信先。サイトのお知らせと SNS を1画面で扱う */
export type PostChannel = 'site' | 'instagram' | 'facebook';

export type Post = {
  id: string;
  /** 日本語原本。管理画面は日本語のみ */
  title: string;
  body: string;
  channel: PostChannel;
  status: PostStatus;
  /** 公開日（published）または公開予定日（scheduled）。下書きは null */
  publishAt: string | null;
  updatedAt: string;
  /** 誰が書いたか。講師は自分の投稿だけを扱う */
  authorId: InstructorId;
  /**
   * 各言語の翻訳状況。日本語が原本なので ja は持たない。
   * 'done' 以外は「翻訳がまだ」と分かるようにする。
   */
  translations: Partial<Record<Exclude<Locale, 'ja'>, 'draft' | 'done'>>;
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

/* ---------- 購入・受講権限（Phase 2 で Stripe / DB に接続する） ---------- */

/**
 * サイト側（購入者）のセッション。
 * 認証が未実装の間、本番では常に null になる（`src/lib/session.ts`）。
 */
export type SiteSession = {
  userId: string;
  email: string;
  /** 購入者が選んだ言語。メール送信もこの言語で行う */
  locale: Locale;
  /** 購入者の販売市場。価格・通貨はここから引く（言語とは独立） */
  market: MarketId;
};

/** 決済の状態。受講権限は 'paid' になって初めて付与する */
export type PurchaseStatus = 'pending' | 'paid' | 'refunded' | 'failed';

/**
 * 1件の購入。買い切り・サブスクではない。
 * Stripe Webhook で 'paid' になったときにだけ entitlement を作る。
 */
export type Purchase = {
  id: string;
  userId: string;
  courseSlug: string;
  status: PurchaseStatus;
  market: MarketId;
  currency: CurrencyCode;
  /** 実際に請求した金額（表示単位の整数）。後から価格を変えても履歴は動かさない */
  amount: number;
  /** Stripe の Checkout Session ID。重複付与を防ぐ照合キー */
  externalId: string | null;
  purchasedAt: string;
};

/**
 * 購入時に取得した同意の記録。
 * EU・英国などのデジタルコンテンツ解約権に対応するため、
 * 「即時提供に同意し、解約権が消滅することを承知した」ことを証跡として残す。
 * 文言は確定前のため、同意した文言のバージョンを必ず一緒に保存する。
 */
export type Consent = {
  userId: string;
  purchaseId: string | null;
  kind: 'immediate-access-waiver';
  /** 同意した時点の文言バージョン。文言を変えたら必ず新しい版にする */
  textVersion: string;
  locale: Locale;
  agreedAt: string;
};

/**
 * 受講権限。視聴期限なしを基本とするため expiresAt は null を既定とする。
 * **購入完了画面では作らない。Stripe Webhook の確認後にだけ作る。**
 */
export type Entitlement = {
  userId: string;
  courseSlug: string;
  grantedAt: string;
  /** null = 無期限 */
  expiresAt: string | null;
};
