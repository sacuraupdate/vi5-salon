// Cloudflare Workers 用の設定（@opennextjs/cloudflare）。
// Phase 1 は確認用のため、R2 などの追加リソースを必要としない構成にしている。
// static-assets-incremental-cache は「再検証を行わず、事前生成済みデータのみを配信する」用途向け。
// Phase 2 で ISR / 再検証が必要になった時点で R2 版へ差し替える。
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
