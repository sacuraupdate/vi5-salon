import { isSupabaseConfigured } from '../env';
import type { CommerceRepository } from './repository';
import { supabaseCommerce } from './supabase-repository';

/**
 * 決済・受講権限のデータアクセス。
 *
 * データベースが未接続なら null を返す。呼び出し側は null を必ず扱うこと。
 * **ダミーのデータを返して「動いているように見せない」。**
 */
export function getCommerce(): CommerceRepository | null {
  return isSupabaseConfigured() ? supabaseCommerce : null;
}

export type { AppUser, CommerceRepository, CreatePurchaseInput, CreateUserInput } from './repository';
