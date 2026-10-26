"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportActorAccountOnly17800000000009 = void 0;
class SupportActorAccountOnly17800000000009 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE platform_support_sessions
        ALTER COLUMN actor_member_id DROP NOT NULL;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DELETE FROM platform_support_sessions WHERE actor_member_id IS NULL;
      ALTER TABLE platform_support_sessions
        ALTER COLUMN actor_member_id SET NOT NULL;
    `);
    }
}
exports.SupportActorAccountOnly17800000000009 = SupportActorAccountOnly17800000000009;
