import type {
  AdminRepository,
  CatalogRepository,
  CourseFilter,
  LearnerRepository,
} from '../repositories';
import type { AdminRole, InstructorId } from '../types';
import { categories, courses, freeContents, instructors } from './catalog';
import { certificates, enrollments, learnerProfile } from './learner';
import {
  adminTasks,
  countrySales,
  courseSales,
  dailySales,
  inquiries,
  salesSummaryInstructor,
  salesSummaryOwner,
  instructorSalesShare,
  posts,
  students,
} from './admin';

/** 管理画面のロールに対応する講師。Phase 2 ではセッションから解決する。 */
const instructorOf = (role: AdminRole): InstructorId => (role === 'owner' ? 'sakura' : 'tomomi');

const matches = (value: string | undefined, target: string) => !value || value === 'all' || value === target;

export const mockCatalog: CatalogRepository = {
  async listCourses(filter: CourseFilter = {}) {
    return courses.filter(
      (c) =>
        matches(filter.categoryId, c.categoryId) &&
        matches(filter.instructorId, c.instructorId) &&
        matches(filter.level, c.level) &&
        (!filter.language || filter.language === 'all' || c.languages.includes(filter.language as never)),
    );
  },
  async getCourse(slug) {
    return courses.find((c) => c.slug === slug) ?? null;
  },
  async listFeaturedCourses(limit = 3) {
    return courses.filter((c) => c.featured).slice(0, limit);
  },
  async listCategories() {
    return categories;
  },
  async listInstructors() {
    return instructors;
  },
  async getInstructor(id) {
    return instructors.find((i) => i.id === id) ?? null;
  },
  async listFreeContents() {
    return freeContents;
  },
};

export const mockLearner: LearnerRepository = {
  async getProfile() {
    return learnerProfile;
  },
  async listEnrollments() {
    return enrollments;
  },
  async getContinueLearning() {
    const active = enrollments.filter((e) => !e.completedAt);
    if (active.length === 0) return null;
    return active.reduce((a, b) => (a.lastStudiedAt >= b.lastStudiedAt ? a : b));
  },
  async listCertificates() {
    return certificates;
  },
};

export const mockAdmin: AdminRepository = {
  async getSalesSummary(role) {
    return role === 'owner' ? salesSummaryOwner : salesSummaryInstructor;
  },
  async listDailySales(role) {
    // 講師には全体の売上推移を見せない。自分の売上規模に合わせて返す
    if (role === 'owner') return dailySales;
    const share = instructorSalesShare;
    return dailySales.map((d) => ({ ...d, jpy: Math.round(d.jpy * share) }));
  },
  async listCourseSales(role) {
    return role === 'owner' ? courseSales : courseSales.filter((s) => s.instructorId === instructorOf(role));
  },
  async listCountrySales(role) {
    // 国別も同様。オーナー以外に全体の内訳を渡さない
    if (role === 'owner') return countrySales;
    const share = instructorSalesShare;
    return countrySales.map((c) => ({
      ...c,
      orders: Math.max(1, Math.round(c.orders * share)),
      jpy: Math.round(c.jpy * share),
    }));
  },
  async listTasks(role) {
    const id = instructorOf(role);
    return role === 'owner' ? adminTasks : adminTasks.filter((t) => t.instructorId === id);
  },
  async listInquiries(role) {
    const id = instructorOf(role);
    return role === 'owner' ? inquiries : inquiries.filter((q) => q.instructorId === id);
  },
  async listStudents(role) {
    const id = instructorOf(role);
    return role === 'owner' ? students : students.filter((s) => s.instructorIds.includes(id));
  },
  async listPosts(role) {
    const id = instructorOf(role);
    // 講師は自分が書いた投稿だけを扱う。他講師の投稿は見せない
    const mine = role === 'owner' ? posts : posts.filter((p) => p.authorId === id);
    return [...mine].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
};
