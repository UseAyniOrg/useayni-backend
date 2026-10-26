"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestoreMemberAcademicRelations17800000000013 = void 0;
class RestoreMemberAcademicRelations17800000000013 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE course_universities
        ADD COLUMN IF NOT EXISTS external_course_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS source VARCHAR(50),
        ADD COLUMN IF NOT EXISTS degree_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS modality VARCHAR(100),
        ADD COLUMN IF NOT EXISTS academic_level VARCHAR(100)
    `);
        await queryRunner.query(`
      ALTER TABLE universities
        ADD COLUMN IF NOT EXISTS emec_code VARCHAR(30),
        ADD COLUMN IF NOT EXISTS source VARCHAR(50),
        ADD COLUMN IF NOT EXISTS category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL
    `);
    }
    async down() {
        throw new Error('Migração de reparo não reversível automaticamente: as colunas podem conter dados anteriores ao reparo.');
    }
}
exports.RestoreMemberAcademicRelations17800000000013 = RestoreMemberAcademicRelations17800000000013;
