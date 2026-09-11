'use client';

import { useState } from 'react';
import { ArrowLeft, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';

/**
 * 投稿の作成フォーム。ラベル・説明・エラーはすべて日本語。
 * Phase 1 では保存先が無いため、送信すると「まだ保存されない」ことを日本語で明示する。
 * Phase 2 で保存処理に差し替えるときは handleSubmit の中だけを変える。
 */

const channels = [
  { value: 'site', label: 'サイトのお知らせ', help: 'サイトの「お知らせ」に掲載します。' },
  { value: 'instagram', label: 'Instagram', help: '画像とあわせて投稿する文面です。' },
  { value: 'facebook', label: 'Facebook', help: '長めの文章でも読まれやすい発信先です。' },
] as const;

const timings = [
  { value: 'draft', label: '下書きとして保存', help: 'まだ公開しません。あとから続きを書けます。' },
  { value: 'now', label: 'すぐ公開する', help: '保存すると同時に公開します。' },
  { value: 'scheduled', label: '日付を決めて公開', help: '指定した日に自動で公開します。' },
] as const;

const labelClass = 'text-[13px] font-medium text-ink';
const helpClass = 'text-[11px] leading-relaxed text-ink-muted';
const fieldClass =
  'w-full rounded-sm border border-line bg-bg px-3 py-2.5 text-[14px] text-ink outline-none focus:border-navy';

export default function PostForm({ authorName }: { authorName: string }) {
  const [channel, setChannel] = useState<(typeof channels)[number]['value']>('site');
  const [timing, setTiming] = useState<(typeof timings)[number]['value']>('draft');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(false);

    // 何が足りないかを日本語で具体的に伝える。エラーコードだけで終わらせない
    if (!title.trim()) return setError('タイトルを入力してください。');
    if (!body.trim()) return setError('本文を入力してください。');
    if (timing === 'scheduled' && !publishAt) return setError('公開する日を選んでください。');

    setError(null);
    setSent(true);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href="/admin/posts" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        投稿一覧へ戻る
      </Link>

      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
          <Megaphone className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl">新しい投稿を書く</h1>
          <p className="text-[13px] text-ink-muted">
            投稿者：{authorName} ／ 日本語で書いてください。他の言語への翻訳はあとから追加できます。
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="post-title" className={labelClass}>
              タイトル
            </label>
            <input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：日本式のお迎えで最初にすること"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="post-body" className={labelClass}>
              本文
            </label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={9}
              placeholder="お客様に伝えたいことを、そのまま書いてください。"
              className={`${fieldClass} resize-y leading-relaxed`}
            />
            <p className={helpClass}>{body.length} 文字</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-5">
          <fieldset className="flex flex-col gap-2.5">
            <legend className={labelClass}>どこに出しますか</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {channels.map((c) => (
                <label
                  key={c.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded-sm border p-3 transition-colors ${
                    channel === c.value ? 'border-navy bg-navy/5' : 'border-line hover:border-ink-2'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="channel"
                      value={c.value}
                      checked={channel === c.value}
                      onChange={() => setChannel(c.value)}
                      className="accent-navy"
                    />
                    <span className="text-[13px] font-medium text-ink">{c.label}</span>
                  </span>
                  <span className={helpClass}>{c.help}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className={labelClass}>いつ公開しますか</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {timings.map((tm) => (
                <label
                  key={tm.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded-sm border p-3 transition-colors ${
                    timing === tm.value ? 'border-navy bg-navy/5' : 'border-line hover:border-ink-2'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="timing"
                      value={tm.value}
                      checked={timing === tm.value}
                      onChange={() => setTiming(tm.value)}
                      className="accent-navy"
                    />
                    <span className="text-[13px] font-medium text-ink">{tm.label}</span>
                  </span>
                  <span className={helpClass}>{tm.help}</span>
                </label>
              ))}
            </div>

            {timing === 'scheduled' ? (
              <div className="mt-1 flex flex-col gap-2">
                <label htmlFor="post-date" className={labelClass}>
                  公開する日
                </label>
                <input
                  id="post-date"
                  type="date"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className={`${fieldClass} sm:max-w-[220px]`}
                />
              </div>
            ) : null}
          </fieldset>
        </Card>

        {error ? (
          <p className="border-l-2 border-vermilion py-1 pl-3 text-[13px] text-vermilion" role="alert">
            {error}
          </p>
        ) : null}

        {sent ? (
          <div className="border-l-2 border-navy bg-navy/5 px-4 py-3" role="status">
            <p className="text-[13px] font-medium text-ink">入力内容に問題はありませんでした</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
              ただし Phase 1 のため、まだ保存されません。この画面を離れると内容は消えます。
              データベースに接続する Phase 2 で、このボタンからそのまま保存・公開できるようになります。
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="submit" className={buttonClass('primary', 'lg', 'sm:w-auto')}>
            {timing === 'draft' ? '下書きとして保存する' : timing === 'now' ? '公開する' : '公開を予約する'}
          </button>
          <Link href="/admin/posts" className={buttonClass('secondary', 'lg', 'sm:w-auto')}>
            やめる
          </Link>
        </div>
      </form>
    </div>
  );
}
