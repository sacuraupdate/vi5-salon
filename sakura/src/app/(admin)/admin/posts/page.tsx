import { Megaphone, Plus } from 'lucide-react';
import Link from 'next/link';
import { adminRepository } from '@/lib/data';
import type { Post, PostChannel, PostStatus } from '@/lib/data';
import { getAdminRole } from '@/lib/admin-session';
import { formatDateJa } from '@/lib/format';
import { Badge, Card, EmptyState } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';

/** 発信先と状態のラベル。管理画面はすべて日本語 */
const channelLabel: Record<PostChannel, string> = {
  site: 'サイトのお知らせ',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

const statusLabel: Record<PostStatus, string> = {
  draft: '下書き',
  scheduled: '公開予約',
  published: '公開済み',
};

const translationLabel = { done: '翻訳済み', draft: '下書き' } as const;

export default async function PostsPage() {
  const role = await getAdminRole();
  const posts = await adminRepository.listPosts(role);

  const drafts = posts.filter((p) => p.status === 'draft');
  const scheduled = posts.filter((p) => p.status === 'scheduled');
  const published = posts.filter((p) => p.status === 'published');

  const row = (p: Post) => (
    <li key={p.id} className="flex flex-col gap-2.5 p-4 hover:bg-washi">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[14px] leading-snug text-ink">{p.title}</p>
          <p className="text-[11px] text-ink-muted">
            {channelLabel[p.channel]} ・ {p.publishAt ? `${formatDateJa(p.publishAt)} 公開` : '公開日は未定'}
            {role === 'owner' ? ` ・ ${p.authorId === 'sakura' ? 'SAKURA' : 'TOMOMI'}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge tone={p.status === 'published' ? 'neutral' : p.status === 'scheduled' ? 'sakura' : 'outline'}>
            {statusLabel[p.status]}
          </Badge>
        </div>
      </div>

      <p className="line-clamp-2 text-[12px] leading-relaxed text-ink-muted">{p.body}</p>

      {/* 日本語が原本。他言語がどこまで出来ているかを一目で分かるようにする */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] tracking-[0.1em] text-ink-muted">翻訳</span>
        {(['en', 'ko', 'zh-TW'] as const).map((l) => {
          const state = p.translations[l];
          const name = { en: '英語', ko: '韓国語', 'zh-TW': '繁体字' }[l];
          return (
            <span
              key={l}
              className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${
                state === 'done' ? 'border-pine/40 text-pine' : 'border-line text-ink-muted'
              }`}
            >
              {name}
              {state ? ` ${translationLabel[state]}` : ' 未着手'}
            </span>
          );
        })}
      </div>
    </li>
  );

  const section = (title: string, items: Post[], emptyBody: string) => (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base">{title}</h2>
        <Badge tone="neutral">{items.length}件</Badge>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-5 w-5" />} title={`${title}はありません`} body={emptyBody} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">{items.map(row)}</ul>
        </Card>
      )}
    </section>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl">投稿・発信</h1>
          <p className="text-[13px] text-ink-muted">
            {role === 'owner'
              ? 'サイトのお知らせと SNS 向けの投稿を、ここでまとめて書きます。'
              : '自分が書いた投稿だけを表示しています。ここから新しい投稿を書けます。'}
          </p>
        </div>
        <Link href="/admin/posts/new" className={buttonClass('primary', 'md', 'shrink-0')}>
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          新しい投稿を書く
        </Link>
      </header>

      {section('下書き', drafts, 'まだ書きかけの投稿はありません。')}
      {section('公開予約', scheduled, '公開日を指定した投稿はありません。')}
      {section('公開済み', published, 'まだ公開した投稿はありません。')}

      <p className="text-[11px] text-ink-muted">
        ※ Phase 1 のため、投稿の保存・公開はまだ動作しません。画面と操作の流れだけ先に作っています。
      </p>
    </div>
  );
}
