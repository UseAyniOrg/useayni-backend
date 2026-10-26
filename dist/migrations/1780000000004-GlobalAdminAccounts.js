"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalAdminAccounts17800000000004 = void 0;
class GlobalAdminAccounts17800000000004 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "token" DROP CONSTRAINT IF EXISTS "memberId";
      ALTER TABLE "token" ALTER COLUMN "memberId" DROP NOT NULL;
      ALTER TABLE "token"
        ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS token_account_id_type_idx ON "token" (account_id, type);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM "token" WHERE "memberId" IS NULL;`);
        await queryRunner.query(`DROP INDEX IF EXISTS token_account_id_type_idx;`);
        await queryRunner.query(`ALTER TABLE "token" DROP COLUMN IF EXISTS account_id;`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "memberId" SET NOT NULL;`);
        await queryRunner.query(`
      ALTER TABLE "token"
        ADD CONSTRAINT "memberId" FOREIGN KEY ("memberId")
        REFERENCES members(id) ON DELETE NO ACTION ON UPDATE NO ACTION NOT VALID;
    `);
    }
}
exports.GlobalAdminAccounts17800000000004 = GlobalAdminAccounts17800000000004;
