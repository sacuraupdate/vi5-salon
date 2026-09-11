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
  listCourses(filter?: CourseFilter): Promise<Course[]>;
  getCourse(slug: string): Promise<Course | null>;
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
