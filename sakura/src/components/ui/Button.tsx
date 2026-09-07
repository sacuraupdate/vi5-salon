import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'onNavy' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-[0.06em] transition-colors disabled:opacity-50';

const variants: Record<Variant, string> = {
  // 主ボタン：朱赤のベタ。ページ内で目立たせたい一箇所に使う
  primary: 'bg-vermilion text-white hover:bg-vermilion-deep',
  // 副ボタン：白地＋濃紺の線。主ボタンとはっきり差をつける
  secondary: 'border border-navy bg-bg text-navy hover:bg-navy hover:text-white',
  // 濃紺の面の上に置く副ボタン
  onNavy: 'border border-white/45 bg-transparent text-white hover:bg-white hover:text-navy',
  ghost: 'text-vermilion underline-offset-4 hover:underline',
};

// タップ対象は最小44px（iPhone Safari を主対象にした設計）
const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-[13px]',
  lg: 'min-h-12 px-7 text-sm',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>;

export function ButtonLink({ href, variant, size, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

type ButtonProps = {
  variant?: Variant;
  size?: Size;
} & ComponentProps<'button'>;

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
