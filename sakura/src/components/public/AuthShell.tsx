import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import Logo from '@/components/brand/Logo';
import { PetalShadow, SakuraDivider } from '@/components/brand/Sakura';

/** ログイン／新規登録で共通のレイアウト。左にブランド面、右にフォーム。 */
export default function AuthShell({
  title,
  lead,
  brandCopy,
  demoNote,
  children,
  footer,
}: {
  title: string;
  lead: string;
  brandCopy: string;
  demoNote: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-0 px-4 py-8 sm:py-14 lg:grid-cols-2 lg:gap-10">
      {/* ブランド面（モバイルでは非表示にして1画面1目的を保つ） */}
      <div className="relative hidden overflow-hidden washi-texture rounded-sm border border-line p-8 lg:flex lg:flex-col lg:justify-between">
        <PetalShadow />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative">
          <p className="font-serif text-xl leading-relaxed text-ink">{brandCopy}</p>
          <SakuraDivider className="mt-6" />
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl">{title}</h1>
          <p className="text-sm leading-relaxed text-ink-muted">{lead}</p>
        </div>

        {children}

        <p className="mt-5 flex items-start gap-2 rounded-sm border border-line bg-washi p-3 text-[11px] leading-relaxed text-ink-muted">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          {demoNote}
        </p>

        <div className="mt-5 border-t border-line pt-5 text-sm">{footer}</div>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="min-h-12 rounded-sm border border-line bg-bg px-3 text-ink placeholder:text-ink-muted/70 focus:border-crimson focus:outline-none"
      />
    </div>
  );
}
