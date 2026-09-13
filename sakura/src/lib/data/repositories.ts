import type {
  AdminRole,
  AdminTask,
  Category,
  Certificate,
  CountrySales,
  Course,
  CourseSales,
  DailySales,
  Enrollment,
  FreeContent,
  Inquiry,
  Instructor,
  InstructorId,
  LearnerProfile,
  Post,
  SalesSummary,
  Student,
} from './types';

/**
 * 画面はこのインターフェースだけに依存する。
 * Phase 2 で Supabase 実装に差し替えても、画面側の変更は不要。
 * 全メソッドを Promise にしてあるのは、実I/Oになった時に呼び出し側を変えないため。
 */
export type CatalogRepository = {
  /**
   * 講座の一覧。**既定では一般ユーザーに見せてよい講座だけを返す。**
   * 画面側が絞り込みを書き忘れても、実体の無いサンプルが表に出ない（既定拒否）。
   * 管理画面など、すべて必要な場合だけ filter.includeUnlisted を渡す。
   */
  listCourses(filter?: CourseFilter): Promise<Course[]>;
  /** 公開中の講座だけを返す。非公開の講座は null（＝講座ページは404、購入もできない） */
  getCourse(slug: string): Promise<Course | null>;
  /**
   * 非公開の講座も含めて返す。
   * 出品を止めても、すでに購入した人の受講画面・購入履歴は開けるようにするため。
   * **購入導線では使わない。**
   */
  getCourseAny(slug: string): Promise<Course | null>;
  listFeaturedCourses(limit?: number): Promise<Course[]>;
  listCategories(): Promise<Category[]>;
  listInstructors(): Promise<Instructor[]>;
  getInstructor(id: InstructorId): Promise<Instructor | null>;
  listFreeContents(): Promise<FreeContent[]>;
};

export type CourseFilter = {
  categoryId?: string;
  instructorId?: string;
  level?: string;
  language?: string;
  /** 一般ユーザーに見せない講座も含める。管理画面のみ true にする */
  includeUnlisted?: boolean;
};

export type LearnerRepository = {
  getProfile(): Promise<LearnerProfile>;
  listEnrollments(): Promise<Enrollment[]>;
  /** マイページ最上位の「続きから学ぶ」に出す1件 */
  getContinueLearning(): Promise<Enrollment | null>;
  listCertificates(): Promise<Certificate[]>;
};

export type AdminRepository = {
  getSalesSummary(role: AdminRole): Promise<SalesSummary>;
  listDailySales(role: AdminRole): Promise<DailySales[]>;
  listCourseSales(role: AdminRole): Promise<CourseSales[]>;
  listCountrySales(role: AdminRole): Promise<CountrySales[]>;
  listTasks(role: AdminRole): Promise<AdminTask[]>;
  listInquiries(role: AdminRole): Promise<Inquiry[]>;
  listStudents(role: AdminRole): Promise<Student[]>;
  /** 講師ロールでは自分が書いた投稿だけを返す */
  listPosts(role: AdminRole): Promise<Post[]>;
};
