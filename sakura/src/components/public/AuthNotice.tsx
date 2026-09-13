import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { AuthErrorCode } from '@/lib/auth';

/** URL の error / status から、原因に合った文言を顧客の言語で出す */
const errorKey: Record<AuthErrorCode, string> = {
  'invalid-credentials': 'errInvalidCredentials',
  'email-taken': 'errEmailTaken',
  'weak-password': 'errWeakPassword',
  'invalid-email': 'errInvalidEmail',
  'rate-limited': 'errRateLimited',
  'not-configured': 'errNotConfigured',
  unknown: 'errUnknown',
};

export default async function AuthNotice({
  locale,
  error,
  status,
}: {
  locale: string;
  error?: string;
  status?: string;
}) {
  const a = await getTranslations({ locale, namespace: 'auth' });

  if (status === 'confirm') {
    return (
      <div className="mb-5 flex items-start gap-2.5 border border-pine/40 bg-pine/5 p-4">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pine" strokeWidth={1.5} />
        <span className="flex flex-col gap-1 text-[12px] leading-relaxed">
          <strong className="font-medium text-ink">{a('confirmTitle')}</strong>
          <span className="text-ink-muted">{a('confirmBody')}</span>
        </span>
      </div>
    );
  }

  const key = error && error in errorKey ? errorKey[error as AuthErrorCode] : null;
  if (!key) return null;

  return (
    <div className="mb-5 flex items-start gap-2.5 border border-vermilion/40 bg-vermilion/5 p-4">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" strokeWidth={1.5} />
      <span className="text-[12px] leading-relaxed text-ink">{a(key)}</span>
    </div>
  );
}
