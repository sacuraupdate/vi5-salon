import MyPageNav from '@/components/public/MyPageNav';

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 sm:pb-0">
      <MyPageNav />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</div>
    </div>
  );
}
