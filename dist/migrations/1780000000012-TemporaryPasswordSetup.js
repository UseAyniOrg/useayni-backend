"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporaryPasswordSetup17800000000012 = void 0;
class TemporaryPasswordSetup17800000000012 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE user_accounts
        ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN NOT NULL DEFAULT false;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE user_accounts DROP COLUMN IF EXISTS password_change_required;`);
    }
}
exports.TemporaryPasswordSetup17800000000012 = TemporaryPasswordSetup17800000000012;
