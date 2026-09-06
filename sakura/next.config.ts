import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js が AGENTS.md / CLAUDE.md を自動生成するのを止める。
  // このプロジェクトの恒久ルールはリポジトリルートの CLAUDE.md が唯一の正とする。
  agentRules: false,
};

export default withNextIntl(nextConfig);
