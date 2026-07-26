"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixMiscellaneousOwnersColumns1779004000000 = void 0;
class FixMiscellaneousOwnersColumns1779004000000 {
    async up(queryRunner) {
        const rows = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous_owners'
    `);
        const existing = new Set(rows.map((r) => r.column_name));
        if (!existing.has('role')) {
            await queryRunner.query(`ALTER TABLE miscellaneous_owners ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'owner'`);
        }
        if (!existing.has('is_creator')) {
            const defaultVal = existing.has('is_primary') ? '"is_primary"' : 'FALSE';
            await queryRunner.query(`ALTER TABLE miscellaneous_owners ADD COLUMN is_creator BOOLEAN NOT NULL DEFAULT FALSE`);
            if (existing.has('is_primary')) {
                await queryRunner.query(`UPDATE miscellaneous_owners SET is_creator = is_primary`);
            }
        }
        if (existing.has('is_primary')) {
            await queryRunner.query(`ALTER TABLE miscellaneous_owners DROP COLUMN is_primary`);
        }
    }
    async down(_queryRunner) { }
}
exports.FixMiscellaneousOwnersColumns1779004000000 = FixMiscellaneousOwnersColumns1779004000000;
