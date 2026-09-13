/**
 * 読み込み中。文字を出さずに済むよう、細い罫のプレースホルダだけを置く。
 * 翻訳の読み込みを待たずに即座に描けるようにするため。
 */
export default function Loading() {
  return (
    <div role="status" aria-busy className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-4">
        <span className="h-px w-16 bg-vermilion" />
        <span className="h-6 w-2/3 max-w-sm animate-pulse bg-line" />
        <span className="h-4 w-1/2 max-w-xs animate-pulse bg-line" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <span key={i} className="aspect-16/9 w-full animate-pulse border border-line bg-line/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
