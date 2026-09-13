import { isSupabaseConfigured, supabaseEnv } from './env';

/**
 * Supabase への最小限のアクセス。
 *
 * ライブラリを追加せず fetch だけで済ませている。理由は2つ：
 *  - Cloudflare Workers 上で確実に動く（Node 依存が無い）
 *  - 使うのは数種類の問い合わせだけで、SDK を入れる必要がない
 *
 * **service_role キーを使うため、サーバー側からのみ呼ぶこと。**
 */

export class SupabaseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

type QueryOptions = {
  /** 返す列。既定は全列 */
  select?: string;
  /** 等値の絞り込み */
  eq?: Record<string, string>;
  limit?: number;
};

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = supabaseEnv.serviceRoleKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function url(table: string, query: string): string {
  const base = supabaseEnv.url().replace(/\/$/, '');
  return `${base}/rest/v1/${table}${query ? `?${query}` : ''}`;
}

async function parse<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new SupabaseError(`${what} に失敗しました`, res.status, detail.slice(0, 500));
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const supabase = {
  configured: isSupabaseConfigured,

  async select<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
    const params = new URLSearchParams();
    params.set('select', options.select ?? '*');
    for (const [k, v] of Object.entries(options.eq ?? {})) params.set(k, `eq.${v}`);
    if (options.limit) params.set('limit', String(options.limit));
    const res = await fetch(url(table, params.toString()), { headers: headers(), cache: 'no-store' });
    return (await parse<T[]>(res, `${table} の取得`)) ?? [];
  },

  /** 1件挿入して返す。既に同じ行があれば null（重複は成功として扱う） */
  async insertIgnoreDuplicates<T>(table: string, row: object, onConflict: string): Promise<T | null> {
    const res = await fetch(url(table, `on_conflict=${onConflict}`), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation,resolution=ignore-duplicates' }),
      body: JSON.stringify([row]),
    });
    const rows = await parse<T[]>(res, `${table} への登録`);
    return rows?.[0] ?? null;
  },

  /** 既にあれば更新して返す */
  async upsert<T>(table: string, row: object, onConflict: string): Promise<T> {
    const res = await fetch(url(table, `on_conflict=${onConflict}`), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation,resolution=merge-duplicates' }),
      body: JSON.stringify([row]),
    });
    const rows = await parse<T[]>(res, `${table} の更新`);
    return rows[0];
  },

  async update(table: string, eq: Record<string, string>, patch: object): Promise<void> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(eq)) params.set(k, `eq.${v}`);
    const res = await fetch(url(table, params.toString()), {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(patch),
    });
    await parse<null>(res, `${table} の更新`);
  },
};
