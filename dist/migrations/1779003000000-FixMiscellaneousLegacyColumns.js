"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixMiscellaneousLegacyColumns1779003000000 = void 0;
class FixMiscellaneousLegacyColumns1779003000000 {
    async up(queryRunner) {
        const cols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous'
    `);
        const existing = new Set(cols.map((r) => r.column_name));
        // Drop legacy creator_id (replaced by created_by)
        if (existing.has('creator_id')) {
            await queryRunner.query(`ALTER TABLE miscellaneous DROP COLUMN creator_id`);
        }
        // Rename legacy location columns to new names
        const renames = [
            ['cep', 'location_zip'],
            ['rua', 'location_street'],
            ['numero', 'location_number'],
            ['bairro', 'location_neighborhood'],
            ['cidade', 'location_city'],
            ['estado', 'location_state'],
            ['cover_photo_url', 'cover_url'],
        ];
        for (const [oldName, newName] of renames) {
            if (existing.has(oldName) && !existing.has(newName)) {
                await queryRunner.query(`ALTER TABLE miscellaneous RENAME COLUMN "${oldName}" TO "${newName}"`);
            }
            else if (existing.has(oldName) && existing.has(newName)) {
                // Both exist — migrate data then drop the old one
                await queryRunner.query(`UPDATE miscellaneous SET "${newName}" = "${oldName}" WHERE "${newName}" IS NULL AND "${oldName}" IS NOT NULL`);
                await queryRunner.query(`ALTER TABLE miscellaneous DROP COLUMN "${oldName}"`);
            }
        }
    }
    async down(_queryRunner) {
        // Intentionally not reverting legacy column names
    }
}
exports.FixMiscellaneousLegacyColumns1779003000000 = FixMiscellaneousLegacyColumns1779003000000;
