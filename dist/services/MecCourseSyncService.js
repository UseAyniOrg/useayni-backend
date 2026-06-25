"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MecCourseSyncService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const stream_1 = require("stream");
const util_1 = require("util");
const zlib_1 = require("zlib");
const db_1 = require("../db");
let MecCourseSyncService = class MecCourseSyncService {
    constructor() {
        this.universityByEmecCode = new Map();
        this.cityByIbgeCode = new Map();
        this.courseByNormalizedName = new Map();
        this.coursesCreated = 0;
    }
    async syncFromMecCsv(options) {
        if (!options.sourceFile) {
            throw new Error('Informe --source-file apontando para o ZIP/CSV do Censo da Educacao Superior');
        }
        const batchSize = options.batchSize || 1000;
        const progressEvery = options.progressEvery || 10000;
        await this.loadReferenceCaches();
        const batch = new Map();
        let totalRows = 0;
        let processedRows = 0;
        let skippedRows = 0;
        let universitiesNotFound = 0;
        let citiesNotFound = 0;
        let courseUniversitiesUpserted = 0;
        for await (const record of this.iterateCsvRecords(options.sourceFile)) {
            if (options.limit && totalRows >= options.limit)
                break;
            totalRows += 1;
            const universityCode = this.onlyDigits(record.co_ies);
            const courseName = record.no_curso?.trim();
            const externalCourseId = this.onlyDigits(record.co_curso);
            if (!universityCode || !courseName) {
                skippedRows += 1;
                continue;
            }
            const university = this.universityByEmecCode.get(universityCode);
            if (!university) {
                universitiesNotFound += 1;
                skippedRows += 1;
                continue;
            }
            const cityIbgeCode = this.onlyDigits(record.co_municipio);
            const cityId = cityIbgeCode
                ? this.cityByIbgeCode.get(cityIbgeCode) || university.cityId
                : university.cityId;
            if (!cityId) {
                citiesNotFound += 1;
                skippedRows += 1;
                continue;
            }
            const courseId = await this.findOrCreateCourse(courseName);
            const key = `${courseId}:${university.id}:${cityId}`;
            batch.set(key, {
                courseId,
                universityId: university.id,
                cityId,
                externalCourseId,
                degreeType: record.tp_grau_academico || null,
                modality: record.tp_modalidade_ensino || null,
                academicLevel: record.tp_nivel_academico || null,
            });
            processedRows += 1;
            if (batch.size >= batchSize) {
                courseUniversitiesUpserted += await this.flushCourseUniversityBatch(batch);
            }
            if (options.onProgress && totalRows % progressEvery === 0) {
                options.onProgress({
                    totalRows,
                    processedRows,
                    skippedRows,
                    universitiesNotFound,
                    citiesNotFound,
                    coursesCreated: this.coursesCreated,
                    courseUniversitiesUpserted,
                });
            }
        }
        courseUniversitiesUpserted += await this.flushCourseUniversityBatch(batch);
        options.onProgress?.({
            totalRows,
            processedRows,
            skippedRows,
            universitiesNotFound,
            citiesNotFound,
            coursesCreated: this.coursesCreated,
            courseUniversitiesUpserted,
        });
        return {
            sourceFile: options.sourceFile,
            totalRows,
            processedRows,
            skippedRows,
            universitiesNotFound,
            citiesNotFound,
            coursesCreated: this.coursesCreated,
            courseUniversitiesUpserted,
        };
    }
    async loadReferenceCaches() {
        const [universities, cities, courses] = await Promise.all([
            db_1.AppDataBase.query(`SELECT id, emec_code, city_id FROM universities WHERE emec_code IS NOT NULL`),
            db_1.AppDataBase.query(`SELECT id, ibge_code FROM cities WHERE ibge_code IS NOT NULL`),
            db_1.AppDataBase.query(`SELECT id, name FROM courses`),
        ]);
        this.universityByEmecCode = new Map(universities.map((row) => [
            this.onlyDigits(row.emec_code) || row.emec_code,
            { id: row.id, cityId: row.city_id },
        ]));
        this.cityByIbgeCode = new Map(cities.map((row) => [
            this.onlyDigits(row.ibge_code) || row.ibge_code,
            row.id,
        ]));
        this.courseByNormalizedName = new Map(courses.map((row) => [
            this.normalizeCourseName(row.name),
            row.id,
        ]));
    }
    async findOrCreateCourse(name) {
        const normalizedName = this.normalizeCourseName(name);
        const cachedCourseId = this.courseByNormalizedName.get(normalizedName);
        if (cachedCourseId)
            return cachedCourseId;
        const inserted = await db_1.AppDataBase.query(`INSERT INTO courses (name)
       SELECT $1::varchar
       WHERE NOT EXISTS (
         SELECT 1 FROM courses WHERE LOWER(name) = LOWER($1)
       )
       RETURNING id`, [name]);
        if (inserted[0]?.id) {
            this.courseByNormalizedName.set(normalizedName, inserted[0].id);
            this.coursesCreated += 1;
            return inserted[0].id;
        }
        const existing = await db_1.AppDataBase.query(`SELECT id FROM courses WHERE LOWER(name) = LOWER($1) LIMIT 1`, [name]);
        if (!existing[0]?.id) {
            throw new Error(`Falha ao criar/localizar curso: ${name}`);
        }
        this.courseByNormalizedName.set(normalizedName, existing[0].id);
        return existing[0].id;
    }
    async flushCourseUniversityBatch(batch) {
        if (batch.size === 0)
            return 0;
        const items = Array.from(batch.values());
        batch.clear();
        const params = [];
        const values = items.map((item, index) => {
            const offset = index * 8;
            params.push(item.courseId, item.universityId, item.cityId, item.externalCourseId, 'MEC_CENSO_SUPERIOR_2024', item.degreeType, item.modality, item.academicLevel);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
        });
        await db_1.AppDataBase.query(`INSERT INTO course_universities (
         course_id,
         university_id,
         city_id,
         external_course_id,
         source,
         degree_type,
         modality,
         academic_level
       )
       VALUES ${values.join(', ')}
       ON CONFLICT (course_id, university_id, city_id)
       DO UPDATE SET
         external_course_id = COALESCE(EXCLUDED.external_course_id, course_universities.external_course_id),
         source = EXCLUDED.source,
         degree_type = COALESCE(EXCLUDED.degree_type, course_universities.degree_type),
         modality = COALESCE(EXCLUDED.modality, course_universities.modality),
         academic_level = COALESCE(EXCLUDED.academic_level, course_universities.academic_level)`, params);
        return items.length;
    }
    async *iterateCsvRecords(sourceFile) {
        const stream = await this.createCsvStream(sourceFile);
        const decoder = new util_1.TextDecoder('latin1');
        const delimiter = ';';
        let headers = null;
        let currentRow = [];
        let currentValue = '';
        let insideQuotes = false;
        const normalizeHeader = (value) => this.normalizeHeader(value);
        const emitRow = function* (row) {
            if (row.length === 0 || row.every((value) => !value.trim()))
                return;
            if (!headers) {
                headers = row.map((header) => normalizeHeader(header));
                return;
            }
            const record = {};
            headers.forEach((header, index) => {
                record[header] = (row[index] || '').trim();
            });
            yield record;
        };
        for await (const chunk of stream) {
            const text = decoder.decode(Buffer.from(chunk), { stream: true });
            for (let index = 0; index < text.length; index += 1) {
                const char = text[index];
                const nextChar = text[index + 1];
                if (char === '"') {
                    if (insideQuotes && nextChar === '"') {
                        currentValue += '"';
                        index += 1;
                    }
                    else {
                        insideQuotes = !insideQuotes;
                    }
                    continue;
                }
                if (char === delimiter && !insideQuotes) {
                    currentRow.push(currentValue);
                    currentValue = '';
                    continue;
                }
                if ((char === '\n' || char === '\r') && !insideQuotes) {
                    if (char === '\r' && nextChar === '\n')
                        index += 1;
                    currentRow.push(currentValue);
                    for (const record of emitRow(currentRow))
                        yield record;
                    currentRow = [];
                    currentValue = '';
                    continue;
                }
                currentValue += char;
            }
        }
        const remaining = decoder.decode();
        if (remaining)
            currentValue += remaining;
        if (currentValue || currentRow.length > 0) {
            currentRow.push(currentValue);
            for (const record of emitRow(currentRow))
                yield record;
        }
    }
    async createCsvStream(sourceFile) {
        if (!sourceFile.toLowerCase().endsWith('.zip')) {
            return (0, fs_1.createReadStream)(sourceFile);
        }
        const zipBuffer = await (0, promises_1.readFile)(sourceFile);
        const entry = this.findZipEntry(zipBuffer, 'MICRODADOS_CADASTRO_CURSOS');
        const localOffset = entry.localHeaderOffset;
        if (zipBuffer.readUInt32LE(localOffset) !== 0x04034b50) {
            throw new Error(`Cabecalho local invalido para ${entry.fileName}`);
        }
        const localFileNameLength = zipBuffer.readUInt16LE(localOffset + 26);
        const localExtraFieldLength = zipBuffer.readUInt16LE(localOffset + 28);
        const dataOffset = localOffset + 30 + localFileNameLength + localExtraFieldLength;
        const compressedData = zipBuffer.subarray(dataOffset, dataOffset + entry.compressedSize);
        if (entry.compressionMethod === 0)
            return stream_1.Readable.from([compressedData]);
        if (entry.compressionMethod === 8) {
            return stream_1.Readable.from([compressedData]).pipe((0, zlib_1.createInflateRaw)());
        }
        throw new Error(`Metodo de compressao ZIP nao suportado (${entry.compressionMethod}) em ${entry.fileName}`);
    }
    findZipEntry(zipBuffer, preferredName) {
        const eocdSignature = 0x06054b50;
        let eocdOffset = -1;
        for (let offset = zipBuffer.length - 22; offset >= 0; offset -= 1) {
            if (zipBuffer.readUInt32LE(offset) === eocdSignature) {
                eocdOffset = offset;
                break;
            }
        }
        if (eocdOffset < 0) {
            throw new Error('Arquivo ZIP invalido: diretorio central nao encontrado');
        }
        const centralDirectorySize = zipBuffer.readUInt32LE(eocdOffset + 12);
        const centralDirectoryOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
        const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
        const entries = [];
        let offset = centralDirectoryOffset;
        while (offset < centralDirectoryEnd) {
            if (zipBuffer.readUInt32LE(offset) !== 0x02014b50)
                break;
            const compressionMethod = zipBuffer.readUInt16LE(offset + 10);
            const compressedSize = zipBuffer.readUInt32LE(offset + 20);
            const uncompressedSize = zipBuffer.readUInt32LE(offset + 24);
            const fileNameLength = zipBuffer.readUInt16LE(offset + 28);
            const extraFieldLength = zipBuffer.readUInt16LE(offset + 30);
            const fileCommentLength = zipBuffer.readUInt16LE(offset + 32);
            const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
            const fileName = zipBuffer
                .subarray(offset + 46, offset + 46 + fileNameLength)
                .toString('utf8');
            entries.push({
                fileName,
                compressionMethod,
                compressedSize,
                uncompressedSize,
                localHeaderOffset,
            });
            offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
        }
        const entry = entries.find((item) => item.fileName.toLowerCase().endsWith('.csv') &&
            item.fileName.includes(preferredName));
        if (!entry) {
            throw new Error(`CSV ${preferredName} nao encontrado dentro do ZIP informado`);
        }
        return entry;
    }
    normalizeHeader(value) {
        return this.normalizeKey(value)
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_');
    }
    normalizeCourseName(value) {
        return this.normalizeKey(value).replace(/_+/g, ' ').trim();
    }
    normalizeKey(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_');
    }
    onlyDigits(value) {
        const digits = (value || '').replace(/\D/g, '');
        return digits || null;
    }
};
exports.MecCourseSyncService = MecCourseSyncService;
exports.MecCourseSyncService = MecCourseSyncService = __decorate([
    (0, common_1.Injectable)()
], MecCourseSyncService);
