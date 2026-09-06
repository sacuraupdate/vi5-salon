/**
 * データ取得の入口。画面はここからのみ import する。
 * Phase 2 で Supabase 実装を追加する場合は、この中の分岐に足すだけでよい。
 */
import type { AdminRepository, CatalogRepository, LearnerRepository } from './repositories';
import { mockAdmin, mockCatalog, mockLearner } from './mock';

const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock';

if (source !== 'mock') {
  // Phase 1 では mock 以外の実装を持たない。設定ミスに気づけるよう日本語で明示する。
  throw new Error(
    `データ取得先「${source}」は未実装です。Phase 1 では NEXT_PUBLIC_DATA_SOURCE=mock のみ利用できます。`,
  );
}

export const catalogRepository: CatalogRepository = mockCatalog;
export const learnerRepository: LearnerRepository = mockLearner;
export const adminRepository: AdminRepository = mockAdmin;

export * from './types';
export type { CourseFilter } from './repositories';
