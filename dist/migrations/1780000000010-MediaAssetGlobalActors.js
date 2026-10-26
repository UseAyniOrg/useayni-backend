"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAssetGlobalActors17800000000010 = void 0;
class MediaAssetGlobalActors17800000000010 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE media_assets
        DROP CONSTRAINT IF EXISTS media_assets_uploaded_by_fkey,
        ALTER COLUMN uploaded_by DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS uploaded_by_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DELETE FROM media_assets WHERE uploaded_by IS NULL;
      ALTER TABLE media_assets
        DROP COLUMN IF EXISTS uploaded_by_account_id,
        ALTER COLUMN uploaded_by SET NOT NULL,
        ADD CONSTRAINT media_assets_uploaded_by_fkey
          FOREIGN KEY (uploaded_by) REFERENCES members(id) ON DELETE RESTRICT;
    `);
    }
}
exports.MediaAssetGlobalActors17800000000010 = MediaAssetGlobalActors17800000000010;
