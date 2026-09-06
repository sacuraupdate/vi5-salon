import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**', '.shots/**'] },
  ...coreWebVitals,
  ...nextTypescript,
  {
    // データ層の分離を機械的に強制する：
    // 画面はリポジトリ層(@/lib/data)のみを参照し、モック実装を直接読まない。
    // これにより Phase 2 で Supabase 実装へ差し替える際、画面側の変更が不要になる。
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/data/mock', '@/lib/data/mock/*', '**/lib/data/mock/*'],
              message:
                'モックデータを画面から直接 import しないでください。@/lib/data のリポジトリ経由で取得してください。',
            },
          ],
        },
      ],
    },
  },
];

export default config;
