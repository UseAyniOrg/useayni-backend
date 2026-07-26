"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscellaneousParticipationAndScopeRules1779005000000 = void 0;
class MiscellaneousParticipationAndScopeRules1779005000000 {
    async up(queryRunner) {
        const rows = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous'
    `);
        const mc = new Set(rows.map((r) => r.column_name));
        if (!mc.has('participation_type')) {
            await queryRunner.query(`ALTER TABLE miscellaneous ADD COLUMN participation_type VARCHAR(20) NOT NULL DEFAULT 'public'`);
        }
        if (!mc.has('scope_rules')) {
            await queryRunner.query(`ALTER TABLE miscellaneous ADD COLUMN scope_rules JSONB`);
        }
        if (!mc.has('max_participants')) {
            await queryRunner.query(`ALTER TABLE miscellaneous ADD COLUMN max_participants INT`);
        }
        // Fix miscellaneous_owners
        const ownerRows = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous_owners'
    `);
        const oc = new Set(ownerRows.map((r) => r.column_name));
        if (!oc.has('role')) {
            await queryRunner.query(`ALTER TABLE miscellaneous_owners ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'owner'`);
        }
        if (!oc.has('is_creator')) {
            await queryRunner.query(`ALTER TABLE miscellaneous_owners ADD COLUMN is_creator BOOLEAN NOT NULL DEFAULT FALSE`);
            if (oc.has('is_primary')) {
                await queryRunner.query(`UPDATE miscellaneous_owners SET is_creator = is_primary`);
            }
        }
        if (oc.has('is_primary')) {
            await queryRunner.query(`ALTER TABLE miscellaneous_owners DROP COLUMN is_primary`);
        }
        // Fix forms
        const formRows = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'forms'
    `);
        const fc = new Set(formRows.map((r) => r.column_name));
        if (!fc.has('response_limit_type')) {
            await queryRunner.query(`ALTER TABLE forms ADD COLUMN response_limit_type VARCHAR(20) NOT NULL DEFAULT 'unlimited'`);
        }
        if (!fc.has('public_slug')) {
            await queryRunner.query(`ALTER TABLE forms ADD COLUMN public_slug VARCHAR(255) UNIQUE`);
        }
        if (!fc.has('public_results_enabled')) {
            await queryRunner.query(`ALTER TABLE forms ADD COLUMN public_results_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
        }
    }
    async down(_q) { }
}
exports.MiscellaneousParticipationAndScopeRules1779005000000 = MiscellaneousParticipationAndScopeRules1779005000000;
