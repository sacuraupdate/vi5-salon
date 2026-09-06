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
  async listDailySales() {
    return dailySales;
  },
  async listCourseSales(role) {
    return role === 'owner' ? courseSales : courseSales.filter((s) => s.instructorId === instructorOf(role));
  },
  async listCountrySales() {
    return countrySales;
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
};
