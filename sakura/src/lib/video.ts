import type { Locale, VideoRef } from './data/types';

/**
 * 動画の埋め込み先を作る。配信元をここ1か所に閉じ込めてあるため、
 * 将来 Mux 等へ移す場合もこのファイルと VideoRef の provider を足すだけでよい。
 *
 * **呼び出す前に必ずサーバー側で受講権限を確認すること。**
 * 権限のないユーザーの画面には、動画IDを一切含めない。
 */
export type EmbedSource = { provider: 'youtube'; url: string; title: string };

/** YouTube の動画IDとして妥当か（11文字の英数・ハイフン・アンダースコア） */
export function isValidYouTubeId(id: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

export function isVideoReady(video: VideoRef | undefined): boolean {
  if (!video || video.id === null) return false;
  return video.provider === 'youtube' ? isValidYouTubeId(video.id) : false;
}

/**
 * 埋め込み URL。未登録・不正なIDなら null を返す（壊れた iframe を出さない）。
 * `rel=0` `modestbranding=1` で他チャンネルの関連動画を抑える。
 * 字幕は用意できている言語のみ既定で表示する。
 */
export function embedSource(
  video: VideoRef | undefined,
  locale: Locale,
  title: string,
): EmbedSource | null {
  if (!video || !isVideoReady(video)) return null;

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    hl: locale,
  });
  if (video.captions.includes(locale)) {
    params.set('cc_load_policy', '1');
    params.set('cc_lang_pref', locale);
  }
  return {
    provider: 'youtube',
    url: `https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`,
    title,
  };
}
